/**
 * Module dependencies.
 */
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const yaml = require('js-yaml');
const app = express();
const cron = require('node-cron');

const debug = require('debug');

const fs = require('fs');
const simpleGit = require('simple-git');
const git2json = require('./git2json');
const { analyzeTags } = require('./analyzeTags');

app.use(express.static(path.join(__dirname, '../client/build')));
app.use(bodyParser.json());


// read config.yaml

const configFile = process.env.CONFIG_FILE || path.join(__dirname, '../server/config.yaml');
const config = yaml.load(fs.readFileSync(configFile, 'utf8'));

// get the directory where the repositories are stored
const reposDir = config.repoBaseDir;

/**
 * GET /repos
 * Retrieves the list of repositories in the specified directory.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/repos', (req, res) => {
    try {
        fs.readdir(reposDir, async (err, files) => {
            if (err) {
                res.status(500).send({ message: err.message });
                return;
            }

            const repos = await Promise.all(files.map(async (file) => {
                const repoPath = path.join(reposDir, file);
                const stats = fs.statSync(repoPath);

                if (!stats.isDirectory() || !fs.existsSync(path.join(repoPath, '.git'))) {
                    return null;
                }

                const git = simpleGit(repoPath);
                let log;
                try {
                    log = await git.log({ maxCount: 1 });
                } catch (error) {
                    console.error(`Error getting log for repo ${repoPath}: ${error.message}`);
                    return null;
                }

                return {
                    name: file,
                    description: log ? log.latest.message : 'No commits yet',
                    commitid: log ? log.latest.hash : 'No commits yet',
                };
            }));

            res.send(repos.filter(Boolean));

        });
    } catch (error) {
        console.error(`Error getting repos: ${error.message}`);
        res.status(500).send({ message: error.message });
    }
});

/**
 * GET /repos/:repoName/branches
 * Retrieves the list of branches for a specific repository.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/repos/:repoName/branches', async (req, res) => {
    try {
        const repoPath = path.join(reposDir, req.params.repoName);
        const filter = req.query.filter;

        if (!fs.existsSync(repoPath) || !fs.existsSync(path.join(repoPath, '.git'))) {
            res.status(404).send({ message: 'Repository not found' });
            return;
        }

        const git = simpleGit(repoPath);
        let branchSummary;
        if (filter) {
            branchSummary = await git.branch(['-r','--list', filter]);
            res.send(branchSummary.branches);
            return;
        } else {
            branchSummary = await git.branch(['-r']);
        }

        // iterate over ObjectEntries(branchSummary.branches) and add imageTagMap to each branch
        for (const [key, branch] of Object.entries(branchSummary.branches)) {
            branch.imageTagMap = await readYamlFiles(reposDir, repoPath, branch.name);
        }

        res.send(branchSummary.branches);
    } catch (error) {
        console.error(`Error getting branches for repo ${req.params.repoName}: ${error.message}`);
        res.status(500).send({ message: error.message });
    }
});

/**
 * GET /repos/:repoName/branches/:branch/files
 * Retrieves the list of files in a specific branch of a repository.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/repos/:repoName/branches/:branch/files', async (req, res) => {
    try {
        const repoPath = path.join(reposDir, req.params.repoName);
        const branch = req.params.branch;

        // get files in the branch
        const git = simpleGit(repoPath);
        const files = await git.raw(['ls-tree', '-r', '--name-only', branch, '--']);

        res.send(files.split('\n').filter(Boolean));
    } catch (error) {
        console.error(`Error getting files for repo ${req.params.repoName} and branch ${req.params.branch}: ${error.message}`);
        res.status(500).send({ message: error.message });
    }
});

/**
 * GET /repos/:repoName/branches/:branch/files/:filePath(*)
 * Retrieves the content of a specific file in a specific branch of a repository.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/repos/:repoName/branches/:branch/files/:filePath(*)', async (req, res) => {
    try {
        const repoPath = path.join(reposDir, req.params.repoName);
        const branch = req.params.branch;

        const branchRef = `${branch}`;
        const filePath = req.params.filePath;

        // get file content
        // check if git repo exists
        if (fs.existsSync(repoPath)) {
            const git = simpleGit(repoPath);
            const file = await git.show([`${branchRef}:${filePath}`]);

            res.send(file);
        } else {
            res.status(404).send({ message: 'Repository not found' });
        }
    } catch (error) {
        console.error(`Error getting file content for repo ${req.params.repoName} and branch ${req.params.branch}: ${error.message}`);
        res.status(500).send({ message: error.message });
    }
});

/**
 * GET /repos/:repoName/tags
 * 
 * Retrieves the list of tags for a specific repository.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * 
 * */
app.get('/repos/:repoName/tags', async (req, res) => {
    try {
        const repoPath = path.join(reposDir, req.params.repoName);

        // get tags in the repo
        const git = simpleGit(repoPath);
        const tags = await git.tags();

        res.send(tags.all);
    } catch (error) {
        console.error(`Error getting tags for repo ${req.params.repoName}: ${error.message}`);
        res.status(500).send({ message: error.message });
    }
});

/** 
 * GET /repos/:repoName/commits
 * Retrieves the commit history for a specific repository.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
*/
app.get('/repos/:repoName/commits', async (req, res) => {
    try {
        const repoPath = path.join(reposDir, req.params.repoName);
        const branch = req.query.branch;
        const filePath = req.query.filePath;

        let extraLogOptions = [];
        if (branch && filePath) {
            extraLogOptions: [branch, '--all', '--', filePath.replace(/^\//, '')];
        } else if (branch) {
            extraLogOptions: [branch, '--all', '--'];
        } else {
            extraLogOptions: ['--all']
        }

        let json = await git2json.git2json({ path: repoPath, extraLogOptions});

        console.log(json);
        res.send(json);
    } catch (error) {
        console.error(`Error getting commit history for repo ${req.params.repoName}: ${error.message}`);
        res.status(500).send({ message: error.message });
    }
});

app.get('/repos/:repoName/versions', async (req, res) => {
    try {

        const retval = {"1.0.1": {
            repositories: [ 
                {
                    name: "GitRepo 1",
                    tag: "1.0.1",
                    pkgs: ["My Package", "My Package 2"]
                },
                {
                    name: "GitRepo 2",
                    tag: "1.0.1",
                    pkgs: ["My Package", "My Package 2"]
                }
            ]
        }};


        res.send(retval);
    } catch (error) {
        console.error(`Error getting versions for repo ${req.params.repoName}: ${error.message}`);
        res.status(500).send({ message: error.message });
    }
});

// get the profile configuration
app.get('/config', (req, res) => {
    res.send(config);
});

/**
 * POST /repos/:repoName/tag
 * Tags a specific branch of a repository.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 **/
app.post('/repos/:repoName/tag', async (req, res) => {
    try {
        const repoPath = path.join(reposDir, req.params.repoName);
        const branch = req.body.branch;
        const tag = req.body.tagName;

        // get commit history
        const git = simpleGit(repoPath);



        let tagResult;

        tagResult = await git.tag(['-a', tag, `${branch}`, '-m', `Tagging branch ${branch} with tag ${tag}`]);
        console.log(`Tagged branch ${branch} with tag ${tag} for repo ${req.params.repoName}`);

        // push the tag to the remote repository
        let pushResult = await git.push(['origin', tag]);

        console.log(`Pushed tag ${tag} to the remote repository for repo ${req.params.repoName}`);

        res.send(tagResult);
    } catch (error) {
        console.error(`Error tagging for repo ${req.params.repoName}: ${error.message}`);
        res.status(500).send({ message: error.message });
    }
});

async function readYamlFiles(dir, repoPath, branch) {
    // get yaml files in the branch
    const git = simpleGit(repoPath);
    const branchRef = `${branch}`;
    const files = await git.raw(['ls-tree', '-r', '--name-only', branchRef, '--']);
    const yamlFiles = files.split('\n').filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    // find image.tag in yaml files
    const imageTagMap = {};
    for (const file of yamlFiles) {
        const content = await git.show([`${branchRef}:${file}`]);
        try {
            const yamlDoc = await yaml.load(content);
            console.log(yamlDoc);
            if (yamlDoc && yamlDoc.image && yamlDoc.image.tag) {
                imageTagMap[file] = yamlDoc.image.tag;
            }
        } catch (error) {
            console.error(`Error parsing YAML file ${file}: ${error.message}`);
        }
    }
    console.log(imageTagMap);

    return imageTagMap;
}

/**
 * Default route handler.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

function createCronJob() {
    return cron.schedule(config.scheduler.cronExpression, async () => {
        // iterate over config.repositories
        for (const repo of config.repositories) {
            const repoPath = path.join(reposDir, repo.name);
            if (!fs.existsSync(repoPath)) {
                // clone the repository
                const git = simpleGit();
                try {
                    // clone repo but do not checkout
                    await git.clone(repo.url, repoPath, { '--no-checkout': null });
                    console.log(`cloned repo from the repository at ${repoPath}`);

                    // Fetch all branches from the remote repository
                    const fetchResult = await git.fetch();
                    if (fetchResult) {
                        console.log(`fetched all branches from the repository at ${repoPath}`);
                    }

                } catch (err) {
                    console.error(`Error cloning repository from ${repoPath}: ${err.message}`);
                }
                console.error(`Repository base directory ${config.repoBaseDir} not found`);
                continue;
            } else {

                // fetch changes and branches
                const git = simpleGit(repoPath);
                try {
                    await git.fetch('--all');
                    console.log(`Fetched all branches from the repository at ${repoPath}`);
                } catch (err) {
                    console.error(`Error fetching changes from ${repoPath}: ${err.message}`);
                }
            }
        }
    }, {
        scheduled: false  // Don't start the task immediately
    });
}
/**
 * Start the server.
*/
app.listen(3000, () => {
    const task = createCronJob();
    //task.start();  // Start the task immediately
    console.log('Server is running on port 3000');
});
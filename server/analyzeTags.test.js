const { analyzeTags } = require('./analyzeTags.js');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const os = require('os');


describe('analyzeTags', () => {
    it('should return a map of tag to file content', async () => {
        // create a git repo in a temporary directory using simple-git

        // Create a temporary directory
        const tempDir = createTempRepo();

        const repoPath = (await tempDir).toString();
        const tagFilter = '.*';


        // Call the analyzeTags function
        const result = await analyzeTags(repoPath, tagFilter);

        // Assert the result
        expect(result).toEqual({
            'v1.0.0': 'file content',
        });

    });

});

async function createTempRepo() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-'));

    console.log('tempDir:', tempDir);
    // Initialize a Git repository in the temporary directory
    const git = simpleGit(tempDir);
    await git.init((err, result) => {
        if (err) {
            console.error(`Error initializing Git repository: ${err.message}`);
        } else {
            console.log(`Git repository initialized in ${tempDir}`);
        }
    });

    // Create a file in the repository
    const file = path.join ('build', 'packages.yaml');
    const filePath = path.join(tempDir, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'file content', 'utf8');

    console.log(`Created file ${filePath}`);

    // Add the file to the repository
    await git.add(file);
    
    // Commit the changes
    await git.commit('Initial commit');

    // Create a tag
    await git.tag(['-a', 'v1.0.0', `master`, '-m', `Tagging branch with tag`]);

    return tempDir;
}

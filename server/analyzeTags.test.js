const { analyzeTags, transformConfig } = require('./analyzeTags.js');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const os = require('os');

const packages_v1 = createPackagesYamlFile("1.0.0-rc4-sc1",["MyPackage1", "MyPackage2"]);
const packages_v2 = createPackagesYamlFile("2.0.0-rc2-sc1",["MyPackage3", "MyPackage4"]);


describe('analyzeTags', () => {
    it('should return a map of tag to file content', async () => {
        // create a git repo in a temporary directory using simple-git

        // Create a temporary directory
        const tempDir = createTempRepo();

        const repoPath = (await tempDir).toString();

        
        const tagFilter = '[0-9]+.[0-9]+.[0-9]+-rc[0-9]+-sc1';

        // Call the analyzeTags function
        const result = await analyzeTags(repoPath, tagFilter);

        // Assert the result
        expect(result).toEqual({
            '1.0.0-rc4-sc1': packages_v1,
            '2.0.0-rc2-sc1': packages_v2
        });


    });

});

describe('transformConfig', () => {
    it('should return a transformed config object', () => {
        const inputConfig = {
            repositories: [
                {
                    name: 'my-repo',
                    tag: '1.0.0-rc4-sc1'
                }
            ],
            packages: [
                {
                    repo: 'my-repo',
                    names: ['MyPackage1', 'MyPackage2']
                }
            ]

        };

        const tag = '1.0.0-rc4-sc1';
        const packages = ['MyPackage1', 'MyPackage2'];

        const result = transformConfig(inputConfig, tag);

        expect(result).toEqual({
            tag: '1.0.0-rc4-sc1',
            repositories: [
                {
                    name: 'my-repo',
                    tag: '1.0.0-rc4-sc1',
                    packages: ['MyPackage1', 'MyPackage2']
                }
            ]
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
    fs.writeFileSync(filePath, packages_v1, 'utf8');

    console.log(`Created file ${filePath}`);

    // Add the file content with v1 packages
    await git.add(file);
    await git.commit('Initial commit');
    await git.tag(['-a', '1.0.0-rc4-sc1', `master`, '-m', `Tagging branch with tag`]);

    // change the file content with v2 packages
    fs.writeFileSync(filePath, packages_v2, 'utf8');
    await git.add(file);
    await git.commit('Second commit');
    await git.tag(['-a', '2.0.0-rc2-sc1', `master`, '-m', `Tagging branch with tag`]);

    // add a simple tag that should be ignored
    await git.tag(['-a', '2.0.0-rc2-sc3', `master`, '-m', `Tagging config change with tag`]);

    return tempDir;
}

function createPackagesYamlFile (tag, packages) {
    const packagesString = packages.map(pkg => `          - ${pkg}`).join('\n');
    const content = `
    destinationPath: /opt/softwareag/IntegrationServer/packages

    repositories:

      - name: my-repo
        url: https://myrepo.com/git/my-repo.git
        username: $_GIT_USER
        password: $_GIT_PASSWORD
        tag: ${tag}
    
    packages:
      - repo: my-repo
        prefix: IS
        names:
${packagesString}
    
    `;

    return content;
}


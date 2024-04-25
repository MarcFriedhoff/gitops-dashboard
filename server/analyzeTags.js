const path = require('path');
const simpleGit = require('simple-git');

async function analyzeTags(repoPath, tagFilter) {

    console.log(`Analyzing tags in repo ${repoPath} with filter ${tagFilter}`);
    const git = simpleGit(repoPath);
    const tags = await git.tags();
    const tagToFileMap = {};

   // const filteredTags = tags.all.filter(tag => tagFilter.test(tag));

    console.log(JSON.stringify(tags));

    for (const tag of tags.all) {
        const filePath = path.join('build', 'packages.yaml');
        console.log(`Reading file ${filePath} from tag ${tag}`);
        try {
            const fileContent = await git.show([`${tag}:${filePath}`]);
            tagToFileMap[tag] = fileContent;
        } catch (error) {
            console.error(`Error reading file ${filePath}: ${error.message}`);
        }
    }

    return tagToFileMap;
}
exports.analyzeTags = analyzeTags;

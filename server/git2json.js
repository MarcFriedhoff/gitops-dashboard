const parsers = require('./parsers');
const simpleGit = require('simple-git');

// Default fields
// see https://git-scm.com/docs/pretty-formats for placeholder codes
const defaultFields = {
    refs: { value: '%d', parser: parsers.refs },
    hash: { value: '%H' },
    hashAbbrev: { value: '%h' },
    tree: { value: '%T' },
    treeAbbrev: { value: '%t' },
    parents: { value: '%P', parser: parsers.parents },
    parentsAbbrev: { value: '%p', parser: parsers.parents },
    'author.name': { value: '%an' },
    'author.email': { value: '%ae' },
    'author.timestamp': { value: '%at', parser: parsers.timestamp },
    'author.date': { value: '%ah' },
    'committer.name': { value: '%cn' },
    'committer.email': { value: '%ce' },
    'committer.timestamp': { value: '%ct', parser: parsers.timestamp },
    subject: { value: '%s' },
    body: { value: '%b' },
    notes: { value: '%N' }
};

/**
 * Execute git log on current folder and return a pretty object
 *
 * @param {object} [options]
 * @param {object} [options.fields] - fields to exports
 * @param {string} [options.path] - path of target git repo
 * @return {Promise}
 */
async function git2json({ fields = defaultFields, path, extraLogOptions = ["--all"] } = {}) {
    // this require can't be global for mocking issue
    const keys = Object.keys(fields);
    const prettyKeys = keys.map(a => fields[a].value).join('%x00');

    const git = simpleGit(path);
    const log = await git.raw(['log', `--pretty=format:%x01${prettyKeys}%x01`, '--numstat', '--date-order', ...extraLogOptions]);

    console.log(log);
    const data = log.split('\u0001');
    const stats = data.filter((a_1, i) => (i + 1) % 2);

    let json = data.filter((a_2, i_1) => i_1 % 2).map((raw, k) => {
        return Object.assign(
            raw.split('\u0000').reduce((mem, field, j) => {
                const value_1 = fields[keys[j]].parser
                    ? fields[keys[j]].parser(field)
                    : field.trim();
                // Deal with nested key format (eg: 'author.name')
                if (/\./.exec(keys[j])) {
                    let nameParts = keys[j].split('.');
                    mem[nameParts[0]] = Object.assign({}, mem[nameParts[0]], {
                        [nameParts[1]]: value_1
                    });
                } else {
                    mem[keys[j]] = value_1;
                }
                return mem;
            }, {}),
            {
                // Add parsed stats of each commit
                stats: stats[k + 1]
                    .split('\n')
                    .filter(a_3 => a_3)
                    .map(a_4 => {
                        let b = a_4.split('\t');
                        return {
                            additions: isNaN(b[0]) ? null : +b[0],
                            deletions: isNaN(b[1]) ? null : +b[1],
                            file: b[2]
                        };
                    })
            }
        );
    });

    return [].concat(...json);
}

module.exports = {
    git2json,
    defaultFields,
    parsers
};
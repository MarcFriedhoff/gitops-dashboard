const GitClone = ({ repoUrl }) => {
    const cleanRepoUrl = repoUrl.replace(/\/\/.*@/, '//');
    return (
        <div>
            <p>Clone repository locally</p>
            <pre>git clone {cleanRepoUrl}</pre>
        </div>
    );
};

export default GitClone;

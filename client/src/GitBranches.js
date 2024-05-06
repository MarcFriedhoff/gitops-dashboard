import React, { useContext, useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Container, Accordion, ListGroup, Breadcrumb, Button, Stack, Popover, Overlay, Offcanvas, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import TreeView, { flattenTree } from "react-accessible-treeview";
import { DiCss3, DiJavascript, DiNpm } from "react-icons/di";
import { FaList, FaFolder, FaFolderOpen } from "react-icons/fa";
import { DiffEditor, Editor } from '@monaco-editor/react';
import { v4 as uuidv4 } from 'uuid';
import { useConfig } from './UseConfig';
import { Bezier2, ListOl, House, Git } from 'react-bootstrap-icons';
import GitTag from './GitTag';
import GitPullRequest from './GitPullRequest';
import GitGraphView from './GitGraphView';
import Versions from './Versions';
import './GitBranches.css';
import { BiGitBranch } from "react-icons/bi";
import GitClone from './GitClone';
import { SiHelm } from "react-icons/si";
import { TbPackages } from "react-icons/tb";




const GitBranches = () => {
    const { repoName } = useParams();
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [files, setFiles] = useState([]);
    const [file, setFile] = useState('');
    const [selectedFileName, setSelectedFileName] = useState('');
    const [compareFile, setCompareFile] = useState('');
    const [compareFileName, setCompareFileName] = useState('');
    const [editorHeight, setEditorHeight] = useState('500px');
    const order = ['default', 'releases', 'other'];

    const [commits, setCommits] = useState([]);

    const [tags, setTags] = useState([]);

    const [selectedButton, setSelectedButton] = useState(null);

    const [showGitTag, setShowGitTag] = useState(false);

    const [showGitPullRequest, setShowGitPullRequest] = useState(false);

    const [selectedCommit, setSelectedCommit] = useState(null);

    const config = useConfig();

    const [prUrl, setPrUrl] = useState(null);

    const [repoUrl, setRepoUrl] = useState(null);

    const [selectedFilePath, setSelectedFilePath] = useState('');

    const [versions, setVersions] = useState({});

    const [content, setContent] = useState(null);

    const [targetVersion, setTargetVersion] = useState(null);

    const [deployTargetsOrder, setDeployTargetsOrder] = useState(null);

    useEffect(() => {
      if (config) {
        const order = config.profiles.default.deployTargets.reduce((map, target, index) => {
          map[target.name] = index;
          return map;
        }, {});
        setDeployTargetsOrder(order);
      }
    }, [config]);

    function sortImageTagMap(branch) {

        return Object.entries(branch.imageTagMap).sort(([a], [b]) => {
            const aKey = a.split('deploy/')[1].split('/')[0]; // Get the string after '/deploy/' and before the next '/' in a
            const bKey = b.split('deploy/')[1].split('/')[0]; // Get the string after '/deploy/' and before the next '/' in b
            return deployTargetsOrder[aKey] - deployTargetsOrder[bKey];
          });
    }

    useEffect(() => {
        // find the target version that starts with targetVersion from versions
        if (!versions || !targetVersion) {
            return;
        }
        const target = Object.keys(versions).find((version) => version.startsWith(targetVersion));
        setContent(target);

    }, [versions, targetVersion]);



    useEffect(() => {

        const fetchVersions = async () => {

            const response = await axios.get(`/repos/${repoName}/versions`).then((response) => {
                setVersions(response.data);
                console.log("setVersions: " + response.data);
            }).catch((error) => {
                console.error(error);
            });


        };

        fetchVersions();

    }, [repoName]);

    useEffect(() => {
        console.log("versions:" + versions);
    }, [versions]);

    useEffect(() => {
        if (config !== null && repoName !== null) {
            const repo = config.repositories.find(repo => repo.name === repoName);
            if (repo) {
                setPrUrl(repo.prUrl);
                console.log("prUrl" + repo.prUrl);
            }
        }
    }, [config, repoName]);


    useEffect(() => {
        if (config !== null && repoName !== null) {
            const repo = config.repositories.find(repo => repo.name === repoName);
            if (repo) {
                setRepoUrl(repo.url);
                console.log("url" + repo.url);
            }
        }
    }, [config, repoName]);

    useEffect(() => {
        console.log("prURL" + prUrl);
    }, [prUrl]);


    useEffect(() => {
        const fetchBranches = () => {
            axios.get(`/repos/${repoName}/branches`)
                .then((response) => {
                    const branchMap = new Map();

                    Object.entries(response.data).forEach(([key, value]) => {
                        const category = getCategoryFromBranchName(key);
                        if (!branchMap.has(category)) {
                            branchMap.set(category, []);
                        }
                        branchMap.get(category).push(value);
                    });
                    setBranches(branchMap);
                    console.log(branchMap);
                })
                .catch((error) => {
                    console.error(error);
                });
        };

        fetchBranches();
    }, [repoName, config]);

    function getCategoryFromBranchName(branchName) {
        if (config !== null) {
            console.log(config);
            let branchCategories = config.profiles.default.branchCategories;
            for (const category of branchCategories) {
                for (const branch of category.branches) {
                    const regex = new RegExp(branch.name);
                    if (regex.test(branchName)) {
                        console.log(category.name);
                        return category.name;
                    }
                }
            }
        }

        return "other";
    }

    const handleCommitClick = (commitid) => {
        setSelectedCommit(selectedCommit === commitid ? null : commitid);
    };

    useEffect(() => {
        const updateHeight = () => setEditorHeight(`${window.innerHeight}px`);
        window.addEventListener('resize', updateHeight);
        updateHeight();
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    const handleSelectX = ({ element, isBranch, isExpanded, isSelected, isHalfSelected, isDisabled, treeState }) => {

        if (isSelected) {
            // nodeId is the id of the selected node
            console.log(element);

            // create path from root to selected node from files tree
            let path = [];
            let node = element;
            setSelectedFileName(node.name);
            while (node) {
                path.push(node.name);
                node = files[node.parent];
            }

            let filepath = path.reverse().join('/');

            setSelectedFilePath(filepath);
            if (isBranch) {
                setSelectedFileName(null);
                return;
            } else {


                const fetchFile = async () => {
                    console.log(encodeURIComponent(selectedBranch));
                    const response = await axios.get(`/repos/${repoName}/branches/${encodeURIComponent(selectedBranch)}/files${filepath}`);
                    setFile(response.data);
                };




                fetchFile();
            }
        } else {
            setSelectedFileName(null);
            setSelectedFilePath('');
        }


    };

    useEffect(() => {
        const fetchFile = async () => {
            if (file && selectedBranch && selectedFileName) {
                console.log(encodeURIComponent(selectedBranch) + " " + selectedFileName);
                const response = await axios.get`/repos/${repoName}/branches/${encodeURIComponent(selectedBranch)}/files/${file}`;
                setFile(response.data);
            } else {
                setFile('');
            }
        };

        fetchFile();
    }, []);

    useEffect(() => {

        const fetchCommits = async () => {

            console.log("fetchCommits:" + repoName + " " + selectedBranch + " " + selectedFilePath)
            const response = await axios.get(`/repos/${repoName}/commits?branch=${encodeURIComponent(selectedBranch)}&filePath=${encodeURIComponent(selectedFilePath)}`);

            setCommits(response.data);

        };

        fetchCommits();

    }, [repoName, selectedBranch, selectedFilePath]);

    useEffect(() => {

        const fetchTags = async () => {

            console.log("fetchTags:" + repoName)
            const response = await axios.get(`/repos/${repoName}/tags`);

            setTags(response.data);

        };

        fetchTags();

    }, [repoName]);

    const openGitTagDialog = (event) => {
        event.stopPropagation();
        console.log("Tag Dialog");
        setShowGitTag(true);
    }

    const openGitPullRequestDialog = (event) => {
        event.stopPropagation();
        console.log("Pull Request Dialog");
        setShowGitPullRequest(true);
    }

    const getColorForFile = (fileName) => {
        for (let i = 0; i < config.profiles.default.deployTargets.length; i++) {
            const deployTarget = config.profiles.default.deployTargets[i];
            if (fileName.includes(deployTarget.name)) {
                return deployTarget.color;
            }
        }

        return '';
    };

    const handleCardClick = async (branch, id) => {

        if (branch === selectedBranch) {
            // show all card panels
            document.querySelectorAll('.card').forEach((card) => {
                card.style.display = 'block';
            });
            // clear selected branch
            setSelectedBranch('');
            return;
        } else {
            // hide all other card panels, except the one clicked (branch)
            document.querySelectorAll('.card').forEach((card) => {
                // if card.id is not equal to id, hide the card
                if (card.id !== id && card.id.startsWith('card-')) {
                    card.style.display = 'none';
                }
            });

        }

        setSelectedBranch(branch);

        const response = await axios.get(

            `/repos/${repoName}/branches/${encodeURIComponent(branch)}/files`
        );
        const files = response.data.reduce((acc, file) => {
            const parts = file.split('/');
            let node = acc;
            parts.forEach((part, index) => {
                let existingNode = node.children.find((child) => child.name === part);
                if (existingNode) {
                    node = existingNode;
                } else {
                    const newNode = { name: part, children: [] };
                    node.children.push(newNode);
                    node = newNode;
                }
            });
            return acc;
        }, { name: "", children: [] });


        const data = flattenTree(files);
        console.log(data);
        setFiles(data);
    };

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [showVersions, setShowVersions] = useState(false);

    const handleVersionsClose = () => setShowVersions(false);
    const handleVersionsShow = () => setShowVersions(true);


    const [sizes, setSizes] = useState(['50%', '50%']);

    const layoutCSS = {
        height: '100%',
        display: 'flex',
        alignItems: 'left',
        justifyContent: 'center'
    };

    const [showWpx, setShowWpx] = useState(false);
    const [target, setTarget] = useState(null);
    const ref = useRef(null);

    const handleClick = (event, value) => {
        setShowWpx(!showWpx);
        console.log(value);
        setTargetVersion(value);
        setTarget(event.target);
        event.stopPropagation();
    };

    const [showGitClone, setShowGitClone] = useState(false);
    const handleCloseGitClone = () => setShowGitClone(false);
    const handleShowGitClone = () => setShowGitClone(true);


    return (
        <>
            <Offcanvas show={show} onHide={handleClose}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Git Graph</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <GitGraphView commits={commits}></GitGraphView>
                </Offcanvas.Body>
            </Offcanvas>
            <Offcanvas show={showVersions} onHide={handleVersionsClose}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Versions</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Versions versions={versions}></Versions>
                </Offcanvas.Body>
            </Offcanvas>
            <Offcanvas show={showGitClone} onHide={handleCloseGitClone}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Clone Repository</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <GitClone repoUrl={repoUrl} />
                </Offcanvas.Body>
            </Offcanvas>
            <Container ref={ref}>
                <Overlay
                    show={showWpx}
                    target={target}
                    placement="bottom"
                    container={ref}
                    containerPadding={20}
                    rootClose={true}
                    onHide={() => setShowWpx(false)}
                >
                    <Popover id="popover-contained" style={{ maxWidth: '100%' }}>
                        <Popover.Header as="h3">Contents of version {targetVersion}</Popover.Header>
                        <Popover.Body>
                            <ListGroup>
                                {content ?
                                    versions[content].map((repositories) => (
                                        <ListGroup.Item
                                            className="d-flex justify-content-between align-items-start"
                                        >
                                            <div className="ms-2 me-auto">
                                                <div className="fw-bold">{repositories.name}</div>
                                                {repositories.packages && (
                                                    repositories.packages.map((pkg) => (
                                                        <div>- {pkg}</div>
                                                    ))
                                                )}
                                            </div>

                                            <Badge bg="primary" pill>
                                                {repositories.tag}
                                            </Badge>
                                        </ListGroup.Item>
                                    ))
                                    : <div><i>Could not resolve content from image tag.</i></div>}
                            </ListGroup>

                        </Popover.Body>
                    </Popover>
                </Overlay>
                <nav class="navbar navbar-dark bg-dar justify-content-between">

                    <Breadcrumb>
                        <Breadcrumb.Item href="/"><House /></Breadcrumb.Item>
                        <Breadcrumb.Item href="#" active>{repoName}</Breadcrumb.Item>
                    </Breadcrumb>
                    <Stack direction="horizontal" gap={2}>
                        <Git className="repo-menu" onClick={handleShowGitClone} />
                        <Bezier2 className="repo-menu" onClick={handleShow} />
                        <ListOl className="repo-menu" onClick={handleVersionsShow} />
                        {config && config.profiles.default.deployTargets.map((deployTarget, index) => (
                            <span className="badge badge-pill" style={{ backgroundColor: deployTarget.color, borderColor: deployTarget.color }}>
                                {deployTarget.name}
                            </span>
                        ))}
                    </Stack>
                </nav>
                {Array.from(branches).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
                    .map(([category, branchList]) => (
                        <Row id='{repoName}'>
                            <span>{category}</span>
                            {branchList.map((branch, index) => {
                                const cardId = uuidv4();
                                return (
                                    <Card id={`card-${cardId}`} style={{ width: '18rem', margin: '8px 16px', padding: '0px' }} variant="dark" bg={branch.name === selectedBranch ? 'primary' : 'dark'} text={branch.name === selectedBranch ? 'white' : 'white'} onClick={() => handleCardClick(branch.name, `card-${cardId}`)}>
                                        <Card.Body>
                                            <Card.Title><BiGitBranch /> {branch.name}</Card.Title>
                                            <Card.Text>[{branch.commit}]</Card.Text>
                                            <Card.Text>{branch.label}</Card.Text>
                                            {selectedBranch && (
                                                <Stack direction="horizontal" gap={2}>
                                                    <Button variant="primary" onClick={openGitTagDialog}>Tag</Button> <Button variant="secondary" onClick={openGitPullRequestDialog} >Pull</Button>
                                                </Stack>
                                            )}
                                        </Card.Body>
                                        <Card.Footer>
                                            <div>
                                                {sortImageTagMap(branch).map(([key, value]) => {
                                                    const color = getColorForFile(key);
                                                    console.log("key: " + key + " value: " + value + " color:" + color);
                                                    return (
                                                        <OverlayTrigger
                                                            key={key}
                                                            placement="top"
                                                            overlay={
                                                                <Tooltip id={`tooltip-${key}`}>
                                                                    <div style={{ textAlign: 'left' }}>
                                                                        <div><strong>tag:</strong> {value}</div>
                                                                        <div><strong>source:</strong> {key}</div>
                                                                    </div>
                                                                </Tooltip>
                                                            }
                                                        >
                                                            <Button className="m-1" size="sm" onClick={(event) => handleClick(event, value)} style={{ backgroundColor: color, borderColor: color, maxWidth: '150px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                                {value}
                                                            </Button>
                                                        </OverlayTrigger>
                                                    );
                                                }
                                                )}
                                            </div>
                                        </Card.Footer>

                                    </Card>

                                );
                            }
                            )}
                        </Row>
                    ))}
                <Accordion defaultActiveKey="0" alwaysOpen>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Files</Accordion.Header>
                        <Accordion.Body>
                            {selectedBranch && (
                                <div style={{ display: 'flex' }}>
                                    <div style={{ width: '50%', boxSizing: 'border-box' }}>
                                        {selectedBranch && files && files.length > 0 && (
                                            <div className="ide">
                                                <TreeView
                                                    data={files}
                                                    aria-label="Files"
                                                    togglableSelect
                                                    clickAction="EXCLUSIVE_SELECT"
                                                    multiSelect
                                                    onNodeSelect={handleSelectX}
                                                    nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level }) => (
                                                        <div {...getNodeProps()} style={{ paddingLeft: 20 * (level - 1) }}>
                                                            {isBranch ? (
                                                                <><FolderIcon isOpen={isExpanded} color={getColorForFile (element.name)} /><span>{element.name}</span></>
                                                            ) : (
                                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <FileIcon filename={element.name} />
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                                                                        <span>{element.name}</span>
                                                                        <Button
                                                                            size='sm'
                                                                            variant="outline-secondary"
                                                                            active={selectedButton === element.id}
                                                                            onClick={(event) => {
                                                                                setCompareFileName(selectedButton === element.id ? null : element.name);
                                                                                setSelectedButton(selectedButton === element.id ? null : element.id);
                                                                                let path = [];
                                                                                let node = element;
                                                                                while (node) {
                                                                                    path.push(node.name);
                                                                                    node = files[node.parent];
                                                                                }
                                                                                let filepath = path.reverse().join('/');
                                                                                const fetchFile = async () => {
                                                                                    const response = await axios.get(`/repos/${repoName}/branches/${encodeURIComponent(selectedBranch)}/files${filepath}`);
                                                                                    setCompareFile(response.data);
                                                                                };
                                                                                fetchFile();
                                                                                event.stopPropagation();
                                                                            }}
                                                                        >
                                                                            Compare
                                                                        </Button>

                                                                    </div>
                                                                </div>
                                                            )}

                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        )} {!selectedBranch && (
                                            <div>Select a branch.</div>
                                        )} {selectedBranch && (!files || files.length === 0) && (
                                            <div>No files found.</div>
                                        )}
                                    </div>

                                    <div style={{ width: '50%', boxSizing: 'border-box' }}>
                                        {selectedFileName && !compareFileName && (
                                            <>
                                                {selectedFileName}
                                                <Editor automaticLayout="true" defaultLanguage="javascript" defaultValue="// some comment"
                                                    value={file} theme='vs-dark' height={editorHeight} options={{readOnly: true}} />
                                            </>
                                        )}
                                        {
                                            selectedFileName && compareFileName && (
                                                <>
                                                    <Container>
                                                        <Badge>{selectedFileName}</Badge> vs <Badge bg='secondary'>{compareFileName}</Badge>
                                                    </Container>
                                                    <DiffEditor automaticLayout="true" original={file} modified={compareFile} theme='vs-dark' options={{readOnly: true}} />
                                                </>
                                            )
                                        }
                                        {!selectedFileName && !compareFileName && (
                                            <div class="alert-dark" role="alert">
                                                <strong>Select File</strong> Select a file by clicking on the file name to view the file contents.
                                            </div>
                                        )}
                                    </div>

                                </div>
                            )}
                            {!selectedBranch && (
                                <div class="alert-dark" role="alert">
                                    <strong>Select Branch</strong> Select a branch by clicking on the branch card to view files.
                                </div>
                            )}
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
                <Accordion defaultActiveKey="1">
                    <Accordion.Item eventKey="1">
                        <Accordion.Header>Commits {selectedFileName ? " for " + selectedFileName : ''}</Accordion.Header>
                        <Accordion.Body>
                            <ListGroup>
                                {commits.map((commit, index) => (
                                    <ListGroup.Item className='border-0 m-0 p-0 mb-0'
                                        action
                                        onClick={() => handleCommitClick(commit.hash)}
                                    >{commit.hashAbbrev}: {commit.subject} {commit.date} {commit.author.name} {commit.author.date}</ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
                <Accordion defaultActiveKey="2">
                    <Accordion.Item eventKey="2">
                        <Accordion.Header>Tags</Accordion.Header>
                        <Accordion.Body>
                            <ListGroup>

                                {tags.map((tag, index) => (
                                    <ListGroup.Item action className='border-0 m-0 p-0 mb-0'>
                                        {tag}</ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
                <GitTag repoName={repoName} branch={selectedBranch} show={showGitTag} onHide={() => setShowGitTag(false)} handleClose={() => setShowGitTag(false)} />
                <GitPullRequest prUrl={prUrl} branch={selectedBranch}
                    repoName={repoName} show={showGitPullRequest} onHide={() => setShowGitPullRequest(false)} handleClose={() => setShowGitPullRequest(false)} />
            </Container>
        </>
    );

};

const FolderIcon = ({ isOpen, color }) =>

    isOpen ? (
        <FaFolderOpen color={color} className="icon" />
    ) : (
        <FaFolder color={color} className="icon" />
    );

const FileIcon = ({ filename }) => {
    switch (filename) {
        case "values.yaml":
            return <SiHelm />;
        case "packages.yaml":
            return <TbPackages />;
    }

    const extension = filename.slice(filename.lastIndexOf(".") + 1);
    switch (extension) {
        case "js":
            return <DiJavascript color="yellow" className="icon" />;
        case "css":
            return <DiCss3 color="turquoise" className="icon" />;
        case "json":
            return <FaList color="yellow" className="icon" />;
        case "npmignore":
            return <DiNpm color="red" className="icon" />;
        default:
            return null;
    }
};

export default GitBranches;
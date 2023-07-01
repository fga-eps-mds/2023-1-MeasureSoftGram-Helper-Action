import * as core from '@actions/core';
import * as github from '@actions/github';
const glob = require('globby')
const path = require('path')
import fs from 'fs';
const { readFile } = require('fs-extra')

import { createFolder, generateFilePath, getInfo, getNewTagName, Info, shouldCreateRelease } from './utils';
import Sonarqube from './sonarqube'

const COMMIT_MESSAGE = process.env.COMMIT_MESSAGE || 'Auto generated'

export async function run() {
  try {
    const { repo } = github.context
    const info:Info = getInfo(repo)
    const sonarqube = new Sonarqube(info)
    const currentDate = new Date();
    const octokit = github.getOctokit(
      core.getInput('githubToken', {required: true})
    );

    const metrics = await sonarqube.getMeasures({
      pageSize: 500,
    })

    const { data: latestRelease } = await octokit.rest.repos.getLatestRelease({
      owner: repo.owner,
      repo: repo.repo,
    });

    let tagName = latestRelease.tag_name;
    let newTagName = null;
    let branchName = github.context.ref.split('/').slice(-1)[0];

    console.log("branchName: ", branchName);
    console.log("tagName: ", tagName);

    if (github.context.payload.pull_request) {
      if (!github.context.payload.pull_request.merged) return;

      const labels = github.context.payload.pull_request.labels.map((label: { name: string; }) => label.name)
      console.log("shouldCreateRelease: ", shouldCreateRelease(labels))

      if (shouldCreateRelease(labels)) {
        console.log("Creating release.")
        newTagName = getNewTagName(labels, latestRelease.tag_name);

        await octokit.rest.repos.createRelease({
          ...github.context.repo,
          name: newTagName,
          tag_name: newTagName
        });
      }
    }

    const file_release_name = newTagName ? newTagName : branchName;
    const file_path = generateFilePath(currentDate, repo.repo, file_release_name);

    createFolder('./pipeline');
    createFolder('./pipeline/analytics-raw-data');
    console.log(`Writing file to ${file_path}`);

    fs.writeFile(file_path, JSON.stringify(metrics), (err) => {
      if (err) throw err;
      console.log('Data written to file.');
    });

    uploadToRepo(octokit, './pipeline', repo.owner, repo.repo, 'main');

  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unknown error');
    }
  }
}

const uploadToRepo = async (octo: any, coursePath: string, org: string, repo: string, branch: string) => {
  // gets commit's AND its tree's SHA
  const currentCommit = await getCurrentCommit(octo, org, repo, branch)
  const filesPaths = await glob(coursePath)
  const filesBlobs = await Promise.all(filesPaths.map(createBlobForFile(octo, org, repo)))
  const pathsForBlobs = filesPaths.map(( fullPath: string ) => path.relative(coursePath, fullPath))
  const newTree = await createNewTree(
      octo,
      org,
      repo,
      filesBlobs,
      pathsForBlobs,
      currentCommit.treeSha
  )
  const newCommit = await createNewCommit(
      octo,
      org,
      repo,
      COMMIT_MESSAGE,
      newTree.sha,
      currentCommit.commitSha
  )
  await setBranchToCommit(octo, org, repo, branch, newCommit.sha)
}


const getCurrentCommit = async (octo: any, org: string, repo: string, branch: string) => {
  const { data: refData } = await octo.rest.git.getRef({
      owner: org,
      repo,
      ref: `heads/${branch}`,
  })
  const commitSha = refData.object.sha
  const { data: commitData } = await octo.rest.git.getCommit({
      owner: org,
      repo,
      commit_sha: commitSha,
  })
  return {
      commitSha,
      treeSha: commitData.tree.sha,
  }
}

const getFileAsUTF8 = (filePath: string) => readFile(filePath, 'utf8')

const createBlobForFile = (octo: any, org: string, repo: string) => async (filePath: string) => {
  const content = await getFileAsUTF8(filePath)
  const blobData = await octo.rest.git.createBlob({
      owner: org,
      repo,
      content,
      encoding: 'utf-8',
  })
  return blobData.data
}

const createNewTree = async (octo: any, owner: string, repo: string, blobs: any, paths: string[], parentTreeSha: string) => {
  const tree = blobs.map(({ sha } : any, index: any) => ({
      path: paths[index],
      mode: `100644`,
      type: `blob`,
      sha,
  }))
  const { data } = await octo.rest.git.createTree({
      owner,
      repo,
      tree,
      base_tree: parentTreeSha,
  })
  return data
}

const createNewCommit = async (octo: any, org: string, repo: string, message: string, currentTreeSha: string, currentCommitSha: string) =>
  (await octo.rest.git.createCommit({
      owner: org,
      repo,
      message,
      tree: currentTreeSha,
      parents: [currentCommitSha],
  })).data

const setBranchToCommit = (octo: any, org: string, repo: string, branch: string, commitSha: string) =>
  octo.rest.git.updateRef({
      owner: org,
      repo,
      ref: `heads/${branch}`,
      sha: commitSha,
  })

run();
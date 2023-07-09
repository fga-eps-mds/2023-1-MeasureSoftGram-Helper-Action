import * as core from '@actions/core';
import fs from 'fs';

export interface Info {
    project: {
        sonarProjectKey: string
    }
    host: string
    token: string
}

export function getInfo(repo: { owner: string; repo: string }): Info {
    return {
        project: {
            sonarProjectKey: `${repo.owner}_${repo.repo}`,
        },
        host: core.getInput('host'),
        token: core.getInput('token'),
    }
}

export function createFolder(folderPath: string) {
    fs.mkdir(folderPath, { recursive: true }, (err) => {
        if (err) {
            console.error(`Error creating folder: ${err}`);
            return;
        }
    });
}

export function generateFileName(currentDate: Date, repo: string, file_release_name: string) {
    var seconds = currentDate.getSeconds();
    var minutes = currentDate.getMinutes();
    var hour = currentDate.getHours();

    var year = currentDate.getFullYear();
    var month = currentDate.getMonth()+1;
    var day = currentDate.getDate();

    const formattedDate = `${month}-${day}-${year}-${hour}-${minutes}-${seconds}`;
    const file_path = `fga-eps-mds-${repo}-${formattedDate}-${file_release_name}.json`;

    return file_path;
}

export function getNewTagName(labels: string[], latestTag: string): string {
    const [major, minor, patch] = latestTag.slice(1).split('.');

    if (labels.includes('MAJOR_RELEASE')) {
        return `v${parseInt(major) + 1}.0.0`;
    }
    else if (labels.includes('MINOR_RELEASE')) {
        return `v${major}.${parseInt(minor) + 1}.0`;
    }
    else {
        return `v${major}.${minor}.${parseInt(patch) + 1}`;
    }
}

export function shouldCreateRelease(labels: string[]) {
    return labels.includes('MINOR_RELEASE') || labels.includes('MAJOR_RELEASE') || labels.includes('PATCH_RELEASE');
}
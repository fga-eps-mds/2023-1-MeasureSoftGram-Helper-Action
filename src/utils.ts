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

export function generateFilePath(currentDate: Date, repo: string, file_release_name: string) {
    const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear().toString().padStart(4, '0')}-${currentDate.getHours().toString().padStart(2, '0')}-${currentDate.getMinutes().toString().padStart(2, '0')}`;
    const file_path = `./analytics/analytics-raw-data/fga-eps-mds-${repo}-${formattedDate}-${file_release_name}.json`;

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
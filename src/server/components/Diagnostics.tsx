import React from 'preact/compat';

import { config } from '../../config';

export interface DiagnosticsProps {
  ytdlVersion?: string | null;
  connectionsStatus?: string;
}

export const Diagnostics = (props: DiagnosticsProps) => (
  <div class="vstack gap-3 m-3">
    <h4>Diagnostics</h4>
    <div>Github SHA: {config.githubSha}</div>
    <div>Bot Prefix: {config.botPrefix}</div>
    <div>Cache Dir: {config.cacheDir}</div>
    <div>Youtube Base URL: {config.youtubeBaseUrl}</div>
    <div>Youtube DL Executable: {config.youtubeDLExecutable}</div>
    <div>Youtube DL Max Concurrency: {config.youtubeDLMaxConcurrency}</div>
    <div>Youtube DL Retries: {config.youtubeDLRetries}</div>
    <div>Youtube DL Version: {props.ytdlVersion ?? 'unknown'}</div>
    <div>Bucket Name: {config.minioBucketName}</div>
    <div>Spotify base URL: {config.spotifyBaseUrl}</div>
    <div>Connections: {props.connectionsStatus ?? 'unknown'}</div>
  </div>
);

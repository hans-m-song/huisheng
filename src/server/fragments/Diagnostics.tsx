import React from 'preact/compat';

import { config } from '../../config';

export interface DiagnosticsProps {
  ytdlVersion?: string | null;
  connectionsStatus?: string;
}

export const Diagnostics = (props: DiagnosticsProps) => {
  const data = [
    { key: 'Github SHA', val: config.githubSha },
    { key: 'Bot Prefix', val: config.botPrefix },
    { key: 'Cache Dir', val: config.cacheDir },
    { key: 'Youtube Base URL', val: config.youtubeBaseUrl },
    { key: 'Youtube DL Executable', val: config.youtubeDLExecutable },
    { key: 'Youtube DL Max Concurrency', val: config.youtubeDLMaxConcurrency },
    { key: 'Youtube DL Retries', val: config.youtubeDLRetries },
    { key: 'Youtube DL Version', val: props.ytdlVersion ?? 'unknown' },
    { key: 'Bucket Name', val: config.minioBucketName },
    { key: 'Spotify base URL', val: config.spotifyBaseUrl },
    { key: 'Connections', val: props.connectionsStatus ?? 'unknown' },
  ];

  return (
    <div class="Diagnostics vstack gap-3 m-3">
      <h4>Diagnostics</h4>
      <table class="table table-striped">
        <tbody>
          {data.map(({ key, val }) => (
            <tr key={key}>
              <td style={{ width: 240 }}>{key}</td>
              <td>
                <pre style={{ margin: 'auto' }}>{val}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

import React, { PropsWithChildren } from 'preact/compat';

export interface LayoutProps {
  channelId: string;
}

export const Layout = (props: PropsWithChildren<LayoutProps>) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content="Manage a Huisheng instance" />
      <title>Huisheng Admin Console</title>
      <link rel="stylesheet" href="/static/main.css" />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
        crossorigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        crossorigin="anonymous"
      />
      <link rel="stylesheet" href="/static/main.css" />
    </head>

    <body data-bs-theme="dark" hx-swap="outerHTML">
      <div class="Root">
        <nav class="navbar navbar-expand-md bg-body-tertiary">
          <div class="container-fluid">
            <a class="nav-link nav-active nav-brand" href="/">
              Huisheng
            </a>

            <button
              class="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span class="navbar-toggler-icon" />
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
              <ul class="navbar-nav me-auto">
                <li class="nav-item">
                  <a class="nav-link" href="/channels">
                    Channels
                  </a>
                </li>

                {props.channelId && (
                  <li class="nav-item">
                    <a class="nav-link" href={`/queue/${props.channelId}`}>
                      Queue
                    </a>
                  </li>
                )}

                {props.channelId && (
                  <li class="nav-item">
                    <a class="nav-link" href={`/songs/${props.channelId}`}>
                      Songs
                    </a>
                  </li>
                )}
              </ul>
              <div>
                <a class="link-primary" href="https://github.com/hans-m-song/huisheng">
                  <i class="bi bi-github" style={{ color: 'white' }} />
                </a>
              </div>
            </div>
          </div>
        </nav>

        <div class="App">{props.children}</div>
      </div>

      <script
        src="https://unpkg.com/htmx.org@1.9.12"
        integrity="sha384-ujb1lZYygJmzgSwoxRggbCHcjc0rB2XoQrxeTUQyRjrOnlCoYta87iKBWq3EsdM2"
        crossorigin="anonymous"
      />
      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
        crossorigin="anonymous"
      />
      {process.env.NODE_ENV === 'development' && <script src="/static/debug.js" />}
    </body>
  </html>
);

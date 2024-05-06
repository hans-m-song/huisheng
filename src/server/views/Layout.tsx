import React, { PropsWithChildren } from 'preact/compat';

export interface LayoutProps {
  title?: string;
  description?: string;
}

export const Layout = (props: PropsWithChildren<LayoutProps>) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content={props.description ?? 'Manage a Huisheng instance'} />
      <title>{props.title ?? 'Huisheng Admin Console'}</title>
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
              <ul class="navbar-nav me-auto mb-2 mb-md-0">
                <li class="nav-item">
                  <a
                    class="nav-link"
                    href="#"
                    hx-get="/search"
                    hx-target=".App"
                    hx-swap="innerHTML"
                    hx-push-url="true"
                  >
                    Search
                  </a>
                </li>
                <li class="nav-item">
                  <a
                    class="nav-link"
                    href="#"
                    hx-get="/queue"
                    hx-target=".App"
                    hx-swap="innerHTML"
                    hx-push-url="true"
                  >
                    Queue
                  </a>
                </li>
                <li class="nav-item">
                  <a
                    class="nav-link"
                    href="#"
                    hx-get="/songs"
                    hx-target=".App"
                    hx-swap="innerHTML"
                    hx-push-url="true"
                  >
                    Songs
                  </a>
                </li>
              </ul>
              <div class="mx-3">
                <a class="link-secondary" href="https://github.com/hans-m-song/huisheng">
                  <i class="bi bi-github" />
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

import 'dotenv/config';

import axios, { AxiosInstance } from 'axios';

import { trace } from '@opentelemetry/api';
import { config, log } from '../config';
import { addSpanAttributes, TraceMethod } from './telemetry';
import { encodeQueryParams } from './utils';

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface Session {
  accessToken: string;
  expiresAt: number;
  refresh?: NodeJS.Timeout;
}

interface Pagination<T> {
  limit: number;
  total: number;
  next: string | null;
  items: T[];
}

type PlaylistTracksResponse = Pagination<{
  track: {
    id: string;
    name: string;
    type: string;
    album: {
      id: string;
      name: string;
    };
    artists: {
      id: string;
      name: string;
    }[];
  };
}>;

type AlbumTracksResponse = Pagination<{
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
  }[];
}>;

export interface SpotifyTrack {
  id: string;
  name: string;
  album?: { id: string; name: string };
  artists: { id: string; name: string }[];
}

const tracer = trace.getTracer('spotify');

export class Spotify {
  private static session?: Session;

  @TraceMethod(tracer, 'spotify/assert_session')
  private static async assertSession(): Promise<Session> {
    if (Spotify.session && Spotify.session.expiresAt > Date.now()) {
      return Spotify.session;
    }

    if (Spotify.session?.refresh) {
      clearTimeout(Spotify.session?.refresh);
    }

    const body = {
      grant_type: 'client_credentials',
      client_id: config.SPOTIFY_CLIENT_ID,
      client_secret: config.SPOTIFY_CLIENT_SECRET,
    };

    const response = await axios.post<AccessTokenResponse>(
      'https://accounts.spotify.com/api/token',
      encodeQueryParams(body),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const session = {
      accessToken: response.data.access_token,
      expiresAt: Date.now() + response.data.expires_in,
      refresh: setTimeout(() => Spotify.assertSession, response.data.expires_in - 6000),
    };

    Spotify.session = session;
    return session;
  }

  /**
   * https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks
   */
  async createInstance(): Promise<AxiosInstance> {
    const session = await Spotify.assertSession();

    const instance = axios.create({
      baseURL: config.SPOTIFY_BASE_URL,
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    instance.interceptors.request.use((config) => {
      log.info({
        event: 'Spotify.api',
        method: config.method,
        url: config.url,
        params: config.params,
      });
      return config;
    });

    return instance;
  }

  @TraceMethod(tracer, 'spotify/paginate')
  private async paginate<T>(instance: AxiosInstance, endpoint: string): Promise<T[]> {
    addSpanAttributes({ endpoint });
    const response = await instance.get<Pagination<T>>(endpoint).catch((error) => {
      log.error({ event: 'Spotify.paginate', error, endpoint });
      return null;
    });

    if (!response) {
      return [];
    }

    if (response.data.next) {
      const more = await this.paginate<T>(instance, response.data.next);
      return [...response.data.items, ...more];
    }

    return response.data.items;
  }

  @TraceMethod(tracer, 'spotify/query')
  static async query(path: string): Promise<SpotifyTrack[] | null> {
    addSpanAttributes({ path });
    const [type, id] = path.replace(/^\//, '').split('/');
    log.info({ event: 'Spotify.query', path, type, id });
    if (!type || !id) {
      return null;
    }

    const spotify = new Spotify();

    switch (type) {
      case 'playlist':
        return spotify.getPlaylist(id);
      case 'album':
        return spotify.getAlbum(id);
      default:
        return null;
    }
  }

  /**
   * https://developer.spotify.com/documentation/web-api/reference/get-an-albums-tracks
   */
  @TraceMethod(tracer, 'spotify/get_playlist')
  async getPlaylist(id: string): Promise<SpotifyTrack[] | null> {
    const spotify = await this.createInstance();

    addSpanAttributes({ playlist_id: id });
    const items = await this.paginate<PlaylistTracksResponse['items'][number]>(
      spotify,
      `/playlists/${id}/tracks`,
    );

    return items.map((item) => ({
      id: item.track.id,
      name: item.track.name,
      album: {
        id: item.track.album.id,
        name: item.track.album.name,
      },
      artists: item.track.artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
      })),
    }));
  }

  /**
   * https://developer.spotify.com/documentation/web-api/reference/get-an-albums-tracks
   */
  @TraceMethod(tracer, 'spotify/get_album')
  async getAlbum(id: string): Promise<SpotifyTrack[] | null> {
    const spotify = await this.createInstance();

    addSpanAttributes({ album_id: id });
    const items = await this.paginate<AlbumTracksResponse['items'][number]>(
      spotify,
      `/albums/${id}/tracks`,
    );

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      artists: item.artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
      })),
    }));
  }
}

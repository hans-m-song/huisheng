import 'dotenv/config';

import axios, { AxiosInstance } from 'axios';

import { config } from '../config';
import { encodeQueryParams, logError } from './utils';

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

export interface SpotifyTrack {
  id: string;
  name: string;
  album: { id: string; name: string };
  artists: { id: string; name: string }[];
}

export class Spotify {
  private static session?: Session;

  private static assertSession = async (): Promise<Session> => {
    if (Spotify.session && Spotify.session.expiresAt > Date.now()) {
      return Spotify.session;
    }

    if (Spotify.session?.refresh) {
      clearTimeout(Spotify.session?.refresh);
    }

    const body = {
      grant_type: 'client_credentials',
      client_id: config.spotifyClientId,
      client_secret: config.spotifyClientSecret,
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
  };

  createInstance = async (): Promise<AxiosInstance> => {
    const session = await Spotify.assertSession();

    return axios.create({
      baseURL: config.spotifyBaseUrl,
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
  };

  private async paginate<T>(instance: AxiosInstance, endpoint: string): Promise<T[]> {
    const response = await instance.get<Pagination<T>>(endpoint).catch((error) => {
      logError('Spotify.paginate', error, { endpoint });
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

  async getPlaylist(id: string): Promise<SpotifyTrack[] | null> {
    const spotify = await this.createInstance();

    const items = await this.paginate<PlaylistTracksResponse['items'][number]>(
      spotify,
      `playlists/${id}/tracks`,
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
}

import { FastifyRequest } from 'fastify';
import { createContext } from 'preact';
import { PropsWithChildren, useContext } from 'preact/compat';

export interface PropsContextValue {
  channelId?: string;
  limit: number;
  offset: number;
}

const Context = createContext<PropsContextValue | undefined>(undefined);

export const useProps = () => {
  const value = useContext(Context);
  if (!value) {
    throw new Error('useProps called without a PropsProvider ancestor');
  }

  return value;
};

export const PropsProvider = (props: PropsWithChildren<{ request: FastifyRequest }>) => {
  const { limit, offset } = props.request.query as any;
  const { channelId } = props.request.params as any;
  return (
    <Context.Provider
      value={{
        channelId,
        limit: limit ?? 5,
        offset: offset ?? 0,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};

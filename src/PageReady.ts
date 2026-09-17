import { createContext, useContext } from 'react';

export const PageReadyContext = createContext(true);
export const usePageReady = () => useContext(PageReadyContext);

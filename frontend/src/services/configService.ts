import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = '/api/config';

export interface Config {
  currency: string;
}

// Create axios instance - can be mocked in tests
export const createConfigApiInstance = (): AxiosInstance => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const api = createConfigApiInstance();

export const configService = {
  getConfig: async (): Promise<Config> => {
    const response = await api.get<Config>('');
    return response.data;
  },
};


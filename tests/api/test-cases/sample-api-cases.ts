import type { ApiRecord } from '../helpers/api-assertions';
import {
  validateCompanies,
  validateContinents,
  validatePosts,
  validateTodos,
  validateUsers,
} from '../helpers/sample-api-validators';

type SampleApiCase = {
  description: string;
  url: string;
  validate: (records: ApiRecord[]) => void;
};

export const sampleApiCases: SampleApiCase[] = [
  {
    description: 'GET users returns valid user data',
    url: 'https://fake-json-api.mock.beeceptor.com/users',
    validate: validateUsers,
  },
  {
    description: 'GET companies returns valid company data',
    url: 'https://fake-json-api.mock.beeceptor.com/companies',
    validate: validateCompanies,
  },
  {
    description: 'GET todos returns valid todo data',
    url: 'https://dummy-json.mock.beeceptor.com/todos',
    validate: validateTodos,
  },
  {
    description: 'GET posts returns valid post data',
    url: 'https://dummy-json.mock.beeceptor.com/posts',
    validate: validatePosts,
  },
  {
    description: 'GET continents returns valid reference data',
    url: 'https://dummy-json.mock.beeceptor.com/continents',
    validate: validateContinents,
  },
];

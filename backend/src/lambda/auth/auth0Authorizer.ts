import {
  APIGatewayTokenAuthorizerEvent,
  CustomAuthorizerResult,
} from 'aws-lambda';
import 'source-map-support/register';

import { verify, decode } from 'jsonwebtoken';
import { createLogger } from '../../utils/logger';
import Axios from 'axios';
import { Jwt } from '../../auth/Jwt';
import { JwtPayload } from '../../auth/JwtPayload';

const logger = createLogger('auth');

const jwksUrl = 'https://dev-bbdv9m5y.us.auth0.com/.well-known/jwks.json';

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken);
  try {
    const jwtToken = await verifyToken(event.authorizationToken);
    logger.info('User was authorized', jwtToken);

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      },
    };
  } catch (e) {
    logger.error('User not authorized', { error: e.message });

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*',
          },
        ],
      },
    };
  }
};

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  try {
    const token = getToken(authHeader);

    const jwt: Jwt = decode(token, { complete: true }) as Jwt;
    const cert = await getCertificate(jwksUrl, jwt.header.kid);

    verify(token, cert, { algorithms: ['RS256'] });
    return jwt.payload;
  } catch (err) {
    logger.error('Verify token failed!', err);
    throw new Error('Verify token failed!');
  }
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header');

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header');

  const split = authHeader.split(' ');
  const token = split[1];

  return token;
}

async function getCertificate(jwksUrl: string, kId: string) {
  try {
    const res = await Axios.get(jwksUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': "'true'",
      },
    });

    const keys = res['data']['keys'];
    const signingKeys = keys.filter(
      (key) =>
        key.use === 'sig' &&
        key.kty === 'RSA' &&
        key.kid &&
        key.x5c &&
        key.x5c.length
    );

    const key = signingKeys.find((key) => (key.kid = kId));

    if (!key) {
      logger.error('No signing key found!');
      throw new Error('No signing key found!');
    }
    const cert = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
    return cert;
  } catch (err) {
    logger.error(`Getting certificate failed ${err}`);

    throw new Error('Getting certificate failed!');
  }
}

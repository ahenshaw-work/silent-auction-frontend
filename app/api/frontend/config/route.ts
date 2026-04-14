import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    KEYCLOAK_URL: process.env.KEYCLOAK_URL || '',
    KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || '',
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || '',
    BID_INCREMENT: process.env.BID_INCREMENT || '',
    ADMIN_GROUP_NAME: process.env.ADMIN_GROUP_NAME || '',
  });
}

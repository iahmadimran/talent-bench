'use server';
import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

const ONE_WEEK = 60 * 60 * 24 * 7

export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params

  try {
    const userRecord = await db.collection('users').doc(uid).get();

    if (userRecord.exists) {
      return {
        success: false,
        message: 'User already exists. Please sign in instead.'
      }
    }

    await db.collection('users').doc(uid).set({
      name, email
    })

    return {
      success: true,
      message: 'Account created successfully. Please sign in to continue.'
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error creating a user', error);

    if (error.code === 'auth/email-already-exists') {
      return {
        success: false,
        message: 'This email is already in use.'
      }
    }

    return {
      success: false,
      message: 'Failed to sign up the user. Try again.' 
    }
  }
} 

export async function signIn(params: SignInParams) {
  const { idToken, email } = params;

  try {
    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord) {
      return {
        success: false,
        message: 'User does not exist. Please sign up instead.'
      }
    }
    
    await setSessionCookie(idToken)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log(error);

    return {
      success: false,
      message: 'Failed to sign in the user. Try again.' 
    }
  }
} 

export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: ONE_WEEK * 1000,
  })

  cookieStore.set('session', sessionCookie, {
    maxAge: ONE_WEEK,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  })
}

export async function getCurrentUser() {
  const cookieStore = await cookies()

  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

    const userRecord = await db.collection('users').doc(decodedClaims.uid).get()

    if (!userRecord.exists) {
      return null
    }

    return {
      ...userRecord.data(),
      id: userRecord.id
    } as User

  } catch (error) {
    console.log(error);
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser()

  return !!user;
}
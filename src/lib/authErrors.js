// Map Firebase Auth error codes to friendly messages.
export function friendlyAuthError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.'
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase. Enable it in Authentication → Sign-in method.'
    case 'auth/configuration-not-found':
      return 'Firebase Auth is not configured. Enable Authentication in the Firebase console.'
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Invalid Firebase API key — check your .env values.'
    case 'permission-denied':
      return 'Firestore permission denied. Ensure the security rules are deployed.'
    case 'unavailable':
      return 'Firestore is unavailable — check the database exists and you are online.'
    default:
      return code
        ? `Something went wrong (${code}). Please try again.`
        : 'Something went wrong. Please try again.'
  }
}

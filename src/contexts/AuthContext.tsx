import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, DeliveryAddress } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  userAddress: DeliveryAddress | null;
  loading: boolean;
  isAdmin: boolean;
  isCashier: boolean;
  signup: (email: string, password: string, displayName: string, phoneNumber: string, address: DeliveryAddress) => Promise<void>;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  updateUserAddress: (address: DeliveryAddress) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [userAddress, setUserAddress] = useState<DeliveryAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCashier, setIsCashier] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            setUserData(data);
            setIsAdmin(data.role === 'admin');
            setIsCashier(data.role === 'cashier');

            const addressDoc = await getDoc(doc(db, 'userAddresses', user.uid));
            if (addressDoc.exists()) {
              setUserAddress(addressDoc.data() as DeliveryAddress);
            }
          } else {
            setUserData(null);
            setIsAdmin(false);
            setIsCashier(false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setIsAdmin(false);
          setIsCashier(false);
        }
      } else {
        setUserData(null);
        setUserAddress(null);
        setIsAdmin(false);
        setIsCashier(false);
      }

      // Only set loading false AFTER role is fully resolved
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    phoneNumber: string,
    address: DeliveryAddress
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      const userData: Omit<User, 'uid'> = {
        email,
        displayName,
        phoneNumber,
        role: 'customer',
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, 'userAddresses', user.uid), {
        ...address,
        createdAt: serverTimestamp()
      });

      setUserAddress(address);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setUserAddress(null);
      setIsAdmin(false);
      setIsCashier(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserAddress = async (address: DeliveryAddress) => {
    if (!currentUser) return;

    try {
      await setDoc(doc(db, 'userAddresses', currentUser.uid), {
        ...address,
        updatedAt: serverTimestamp()
      });
      setUserAddress(address);
    } catch (error) {
      console.error('Update address error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    userAddress,
    loading,
    isAdmin,
    isCashier,
    signup,
    login,
    logout,
    updateUserAddress
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
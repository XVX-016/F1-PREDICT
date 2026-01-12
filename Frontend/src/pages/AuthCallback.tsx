import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface AuthCallbackProps {
    onComplete: (page: string) => void;
}

export default function AuthCallback({ onComplete }: AuthCallbackProps) {
    useEffect(() => {
        // Supabase automatically handles the hash/query params and sets the session
        // We just need to wait for it to be ready and redirect the user
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                onComplete('home');
            } else {
                // Fallback to signin if something went wrong
                onComplete('signin');
            }
        };

        checkSession();
    }, [onComplete]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-400 font-medium animate-pulse">
                Completing authentication...
            </p>
        </div>
    );
}

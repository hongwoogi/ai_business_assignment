import React, { useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

const DebugEnv: React.FC = () => {
    const configured = isSupabaseConfigured();
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const [dbStatus, setDbStatus] = React.useState<'Testing...' | 'Success' | 'Error'>('Testing...');
    const [errorMessage, setErrorMessage] = React.useState<string>('');

    React.useEffect(() => {
        const checkConnection = async () => {
            if (!configured) {
                setDbStatus('Error');
                return;
            }
            try {
                // Try to fetch count from grants table
                const { count, error } = await supabase!
                    .from('grants')
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    console.error('DB Connection Error:', error);
                    setDbStatus('Error');
                    setErrorMessage(error.message);
                } else {
                    setDbStatus('Success');
                }
            } catch (err: any) {
                console.error('DB Connection Exception:', err);
                setDbStatus('Error');
                setErrorMessage(err.message || 'Unknown error');
            }
        };
        checkConnection();
    }, [configured]);

    if (process.env.NODE_ENV === 'production') return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-black/90 text-white p-4 rounded-lg text-xs font-mono shadow-lg pointer-events-none max-w-sm">
            <h3 className="font-bold mb-2 border-b border-gray-600 pb-1">System Debug</h3>
            <div className="flex flex-col gap-1">
                <div className="flex justify-between gap-4">
                    <span>Config:</span>
                    <span className={configured ? "text-green-400" : "text-red-400"}>
                        {configured ? "Valid" : "Invalid"}
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span>DB Connection:</span>
                    <span className={dbStatus === 'Success' ? "text-green-400" : dbStatus === 'Error' ? "text-red-400" : "text-yellow-400"}>
                        {dbStatus}
                    </span>
                </div>
                {errorMessage && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-red-300 break-all leading-tight">
                        Error: {errorMessage}
                        <pre className="text-[10px] mt-1 text-gray-400 overflow-x-auto">
                            {JSON.stringify(dbStatus === 'Error' ? errorMessage : {}, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebugEnv;

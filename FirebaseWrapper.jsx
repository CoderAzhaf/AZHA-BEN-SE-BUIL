import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore'; // Added setDoc for initial creation

// --- Global Variables (Provided by the Canvas Environment) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : '';

// --- Application-Specific Constants ---
// Define your collection for public, shared game data (e.g., high scores, game state)
const COLLECTION_NAME = "MyAwesomeGameData"; 
const DOC_ID = "globalGameState"; // Use a single document for global/public data

// --- Game Logic Component Placeholder ---
// Replace this function with your actual game logic (UI, handlers, etc.)
// It now accepts the Firebase state and functions as props.
const GameUI = ({ db, userId, appData, updateGameData, isLoading }) => {
    // Example state management local to the game
    const [score, setScore] = useState(0);

    // Placeholder for your actual game rendering
    if (isLoading) {
        return <div className="text-center p-8 text-xl text-yellow-600">Loading Game State...</div>;
    }

    const currentMessage = appData?.message || "No public data found.";
    
    // Example function to update public data in Firestore
    const handleUpdatePublicData = async () => {
        if (!db || !userId) return console.error("Database not ready.");

        const docRef = doc(db, `artifacts/${appId}/public/data/${COLLECTION_NAME}`, DOC_ID);
        
        try {
            // Update the score and log who did it
            await setDoc(docRef, { 
                lastUpdatedBy: userId,
                highScore: score + 1, // Increment score for demo
                timestamp: new Date().toISOString()
            }, { merge: true });
            setScore(prev => prev + 1); // Update local score immediately
            console.log("Public data updated successfully.");
        } catch (e) {
            console.error("Error updating public data:", e);
        }
    };

    return (
        <div className="p-6 space-y-4 bg-white rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold text-indigo-800">Your Game Title Here</h2>
            <p className="text-gray-600">User ID: <code className="bg-gray-100 p-1 rounded text-sm">{userId}</code></p>
            
            <div className="flex items-center space-x-4">
                <p className="text-2xl font-mono text-green-700">Local Score: {score}</p>
                <button 
                    onClick={() => setScore(score + 10)} 
                    className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-150"
                >
                    Add 10 Points
                </button>
            </div>

            <div className="mt-6 border-t pt-4">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Public Game State (from Firestore)</h3>
                <p className="text-lg text-red-500">Current High Score: {appData?.highScore || 0}</p>
                <button 
                    onClick={handleUpdatePublicData} 
                    disabled={!db}
                    className="mt-3 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-150 disabled:opacity-50"
                >
                    Update High Score ({score + 1}) in DB
                </button>
                <pre className="bg-gray-100 p-3 mt-4 rounded text-xs overflow-x-auto">
                    {appData ? JSON.stringify(appData, null, 2) : 'Awaiting data...'}
                </pre>
            </div>
        </div>
    );
};
// --- END Game Logic Component Placeholder ---


const App = () => {
	// --- FIREBASE STATE ---
	const [db, setDb] = useState(null);
	const [auth, setAuth] = useState(null);
	const [userId, setUserId] = useState(null);
	const [isAuthReady, setIsAuthReady] = useState(false);
	const [appData, setAppData] = useState(null); // State to hold application-specific data

	// 1. Initialize Firebase Services and Authenticate User (Runs once on mount)
	useEffect(() => {
		if (Object.keys(firebaseConfig).length === 0) {
			console.error("Firebase configuration is missing.");
			return;
		}

		try {
			const app = initializeApp(firebaseConfig);
			const firestore = getFirestore(app);
			const firebaseAuth = getAuth(app);
			
			setDb(firestore);
			setAuth(firebaseAuth);

			const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
				if (user) {
					setUserId(user.uid);
					console.log(`User Authenticated. UID: ${user.uid}`);
				} else {
					setUserId(null);
					console.log("User is not authenticated.");
				}
				setIsAuthReady(true);
			});

			const signInUser = async () => {
				try {
					if (initialAuthToken) {
						await signInWithCustomToken(firebaseAuth, initialAuthToken);
					} else {
						await signInAnonymously(firebaseAuth);
					}
				} catch (error) {
					console.error("Firebase Auth Error:", error.message);
					setIsAuthReady(true);
				}
			};

			signInUser();

			return () => {
				unsubscribeAuth();
			};
		} catch (e) {
			console.error("Error during Firebase initialization:", e);
			setIsAuthReady(true);
		}
	}, []); 

	// 2. Data Fetching (Public Data Listener)
	useEffect(() => {
		// Only attach listener when DB is ready and user is authenticated
		if (!isAuthReady || !db || !userId) return;

		const docRef = doc(db, `artifacts/${appId}/public/data/${COLLECTION_NAME}`, DOC_ID);

		const unsubscribeData = onSnapshot(docRef, (docSnapshot) => {
			if (docSnapshot.exists()) {
				setAppData(docSnapshot.data());
			} else {
				console.log("Public document does not exist, creating initial structure...");
				// Create the initial document if it doesn't exist
				setDoc(docRef, { message: "Initial game state created.", highScore: 0, createdBy: userId });
			}
		}, (error) => {
			console.error("Firestore Listener Error:", error);
		});

		return () => unsubscribeData();
	}, [db, userId, isAuthReady]); 

	// 3. Render Logic
	const renderContent = () => {
		// Show loading screen until authentication is complete
		if (!isAuthReady || !db) {
			return (
				<div className="flex justify-center items-center h-full p-16">
					<p className="text-xl font-semibold text-indigo-500 animate-pulse">Initializing Game Services...</p>
				</div>
			);
		}
        
        // Render your GameUI component, passing necessary Firebase state as props
		return (
			<GameUI 
                db={db} 
                userId={userId} 
                appData={appData} 
                isLoading={!appData}
            />
		);
	};

	return (
		<div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans antialiased">
			<div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl">
				{renderContent()}
			</div>
		</div>
	);
};

export default App;
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { useSharedFilesStore } from '../utils/Store';
export function useShareIntent() {
    const appState = useRef(AppState.currentState);
    const { setFiles, clearFiles } = useSharedFilesStore();

    const checkForShare = () => {
        ReceiveSharingIntent.getReceivedFiles(
            (files: SharedFile[]) => {
                if (files?.length) {
                    clearFiles()
                    setFiles(files)
                }
            },
            (_error: unknown) => {
                console.log(_error)
            },
            'com.jsranjan.ivideodownloader' // MUST match applicationId
        );
    };


    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const timeout = setTimeout(checkForShare, 300);

        const sub = AppState.addEventListener('change', (state) => {
            if (
                appState.current.match(/inactive|background/) &&
                state === 'active'
            ) {
                checkForShare();
            }
            appState.current = state;
        });

        return () => {
            clearTimeout(timeout);
            sub.remove();
        };
    }, []);
}

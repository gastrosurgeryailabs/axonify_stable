import React from 'react';
import { Button } from './ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadedFileStatus {
    file: File;
    status: 'uploading' | 'success' | 'error';
    error?: string;
}

interface Props {
    workspaceModel: string;
    apiKey: string;
    serverUrl: string;  // AnythingLLM Server URL
    uploadServerUrl?: string;  // Use this only if you're using unhosted/local AnythingLLM server (e.g. http://localhost:3001)
    isUploadServerConnected?: boolean; // Required when using unhosted/local AnythingLLM server
    disabled?: boolean;
}

const UploadAttachments = ({ 
    workspaceModel, 
    apiKey, 
    serverUrl,
    uploadServerUrl,
    isUploadServerConnected,
    disabled = false 
}: Props) => {
    const { toast } = useToast();
    const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFileStatus[]>([]);
    const [uploadError, setUploadError] = React.useState<string | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);

    // Check if we're using a local AnythingLLM server
    const isLocalServer = React.useMemo(() => {
        return uploadServerUrl !== undefined;
    }, [uploadServerUrl]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // Only check upload server connection for local server setup
        if (isLocalServer && !isUploadServerConnected) {
            toast({
                title: "Error",
                description: "Please ensure local upload server is online before uploading files",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            if (!workspaceModel) {
                throw new Error('No workspace selected');
            }

            if (!apiKey) {
                throw new Error('API key is required');
            }
            
            if (!serverUrl) {
                throw new Error('AnythingLLM Server URL is required');
            }

            // Initialize file statuses
            const newFiles = Array.from(files).map(file => ({
                file,
                status: 'uploading' as const
            }));
            setUploadedFiles(prev => [...prev, ...newFiles]);

            // Upload and embed each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);

                console.log('Uploading and embedding file:', file.name, 'to workspace:', workspaceModel);

                try {
                    // Use serverUrl (AnythingLLM Server URL) for the actual upload
                    const response = await fetch(`${serverUrl}/api/workspace/${workspaceModel}/upload-and-embed`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body: formData
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Upload and embed response:', errorText);
                        throw new Error(`Failed to process file ${file.name}: ${errorText}`);
                    }

                    const result = await response.json();
                    console.log('Upload and embed result:', result);

                    // Update success status for this file
                    setUploadedFiles(prev => prev.map((f) => 
                        f.file === file ? { ...f, status: 'success' as const } : f
                    ));

                    toast({
                        title: "Success",
                        description: `Successfully uploaded ${file.name}`,
                    });
                } catch (error) {
                    console.error('File upload error:', error);
                    // Update error status for this file
                    setUploadedFiles(prev => prev.map((f) => 
                        f.file === file ? { 
                            ...f, 
                            status: 'error' as const, 
                            error: error instanceof Error ? error.message : 'Failed to process file'
                        } : f
                    ));

                    toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : `Failed to upload ${file.name}`,
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            console.error('Process error:', error);
            setUploadError(error instanceof Error ? error.message : 'Failed to process files');
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to process files",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = (fileToRemove: File) => {
        setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
        setUploadError(null);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex flex-col">
                    <label className="text-sm font-medium leading-none mb-2">
                        Upload Attachments
                    </label>
                    <div className="space-y-2">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept=".pdf,.txt,.md,.doc,.docx"
                            multiple
                        />
                        <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                className="w-full"
                                disabled={disabled || isUploading || (isLocalServer && !isUploadServerConnected)}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploading ? "Processing..." : 
                                 (isLocalServer && !isUploadServerConnected) ? "Unhosted Server Not Online" : 
                                 "Select Files"}
                            </Button>
                            {isLocalServer && !isUploadServerConnected && (
                                <p className="text-sm text-yellow-600">
                                    Please ensure unhosted AnythingLLM server is online before uploading files
                                </p>
                            )}
                            {uploadedFiles.length > 0 && (
                                <div className="space-y-1">
                                    {uploadedFiles.map((fileStatus, index) => (
                                        <div key={index} className="flex items-center justify-between bg-muted rounded-md p-2">
                                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                <span className="text-sm truncate flex-1">
                                                    {fileStatus.file.name}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    fileStatus.status === 'uploading' ? 'bg-blue-100 text-blue-700' :
                                                    fileStatus.status === 'success' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {fileStatus.status === 'uploading' ? 'Uploading...' :
                                                     fileStatus.status === 'success' ? 'Uploaded' :
                                                     'Failed'}
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFile(fileStatus.file)}
                                                className="h-8 w-8 p-0 ml-2"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {uploadError && (
                                <p className="text-sm text-destructive">{uploadError}</p>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Upload documents (.pdf, .txt, .md, .doc, .docx) to be used as context for quiz generation.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UploadAttachments; 
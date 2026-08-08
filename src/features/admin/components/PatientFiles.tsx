import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { FileText, Upload, Trash2, Loader2, ExternalLink, HardDrive, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';

interface PatientFile {
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    description: string;
    created_at: string;
    file_size_bytes: number;
}

interface PatientFilesProps {
    patientId: string;
}

// Formatea bytes en formato legible
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PatientFiles = ({ patientId }: PatientFilesProps) => {
    const { maxFileSizeMb, storageLimitMb, appId } = useAuth();
    const [files, setFiles] = useState<PatientFile[]>([]);
    const [totalUsedBytes, setTotalUsedBytes] = useState<number>(0);
    const [allFilesBytes, setAllFilesBytes] = useState<number>(0); // total del app_id
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [fileToDelete, setFileToDelete] = useState<PatientFile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
    const storageLimitBytes = storageLimitMb ? storageLimitMb * 1024 * 1024 : null;
    const storageUsedPercent = storageLimitBytes
        ? Math.min(100, Math.round((allFilesBytes / storageLimitBytes) * 100))
        : 0;
    const storageNearLimit = storageLimitBytes && allFilesBytes >= storageLimitBytes * 0.9;
    const storageFull = storageLimitBytes && allFilesBytes >= storageLimitBytes;

    useEffect(() => {
        fetchFiles();
        if (storageLimitBytes) fetchTotalStorage();
    }, [patientId, appId]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('patient_uploads')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const filesData = data || [];
            setFiles(filesData);
            setTotalUsedBytes(filesData.reduce((sum, f) => sum + (f.file_size_bytes || 0), 0));
        } catch {
            toast.error("Error al cargar archivos");
        } finally {
            setLoading(false);
        }
    };

    // Calcula el total de almacenamiento usado por TODOS los pacientes del app_id
    const fetchTotalStorage = async () => {
        const { data } = await supabase
            .from('patient_uploads')
            .select('file_size_bytes, patients!inner(app_id)')
            .eq('patients.app_id', appId);

        const total = (data || []).reduce((sum: number, f: any) => sum + (f.file_size_bytes || 0), 0);
        setAllFilesBytes(total);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamaño por archivo
        if (file.size > maxFileSizeBytes) {
            toast.error(`El archivo excede el límite de ${maxFileSizeMb} MB por archivo`, {
                description: `Tu archivo pesa ${formatBytes(file.size)}. El máximo permitido en tu plan es ${maxFileSizeMb} MB.`,
            });
            e.target.value = '';
            return;
        }

        // Validar si cabe en el almacenamiento total
        if (storageLimitBytes && (allFilesBytes + file.size) > storageLimitBytes) {
            const remaining = Math.max(0, storageLimitBytes - allFilesBytes);
            toast.error('Límite de almacenamiento alcanzado', {
                description: `Solo tienes ${formatBytes(remaining)} disponibles de tus ${storageLimitMb} MB del Plan Free.`,
            });
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Por favor selecciona un archivo");
            return;
        }

        // Doble check antes de subir
        if (selectedFile.size > maxFileSizeBytes) {
            toast.error(`El archivo supera el límite de ${maxFileSizeMb} MB`);
            return;
        }
        if (storageLimitBytes && (allFilesBytes + selectedFile.size) > storageLimitBytes) {
            toast.error('No hay espacio suficiente en tu almacenamiento');
            return;
        }

        try {
            setUploading(true);
            const fileExt = selectedFile.name.split('.').pop();
            const filePath = `${patientId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('patient_files')
                .upload(filePath, selectedFile);
            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase
                .from('patient_uploads')
                .insert([{
                    patient_id: patientId,
                    file_name: selectedFile.name,
                    file_path: filePath,
                    file_type: selectedFile.type,
                    description: description,
                    file_size_bytes: selectedFile.size,
                }]);
            if (dbError) throw dbError;

            toast.success("Archivo subido correctamente");
            setSelectedFile(null);
            setDescription('');
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            fetchFiles();
            if (storageLimitBytes) fetchTotalStorage();

        } catch {
            toast.error("Error al subir el archivo");
        } finally {
            setUploading(false);
        }
    };

    const confirmDeleteFile = async () => {
        if (!fileToDelete) return;
        try {
            setIsDeleting(true);
            await supabase.storage.from('patient_files').remove([fileToDelete.file_path]);
            const { error } = await supabase.from('patient_uploads').delete().eq('id', fileToDelete.id);
            if (error) throw error;
            toast.success("Archivo eliminado");
            setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
            setAllFilesBytes(prev => prev - (fileToDelete.file_size_bytes || 0));
            setFileToDelete(null);
        } catch {
            toast.error("Error al eliminar el archivo");
        } finally {
            setIsDeleting(false);
        }
    };

    const getFileUrl = (filePath: string) =>
        supabase.storage.from('patient_files').getPublicUrl(filePath).data.publicUrl;

    const getThumbnailUrl = (filePath: string) =>
        supabase.storage.from('patient_files').getPublicUrl(filePath, {
            transform: { width: 300, height: 200, resize: 'cover', quality: 80 }
        }).data.publicUrl;

    const isImage = (type: string) => type.startsWith('image/');

    const barColor = storageUsedPercent >= 90
        ? 'bg-red-500'
        : storageUsedPercent >= 70
            ? 'bg-amber-400'
            : 'bg-sky-500';

    return (
        <div className="space-y-6">

            {/* Barra de almacenamiento — solo Plan Free */}
            {storageLimitMb !== null && (
                <Card className={`border ${storageNearLimit ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-slate-50/50'} rounded-2xl shadow-sm`}>
                    <CardContent className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 font-bold text-slate-600">
                                <HardDrive className="w-4 h-4" />
                                Almacenamiento (Plan Free)
                            </span>
                            <span className={`font-black text-xs ${storageFull ? 'text-red-600' : 'text-slate-500'}`}>
                                {formatBytes(allFilesBytes)} / {storageLimitMb} MB
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                                style={{ width: `${storageUsedPercent}%` }}
                            />
                        </div>
                        {storageNearLimit && !storageFull && (
                            <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Estás cerca de tu límite. Considera eliminar archivos o actualizar al Plan Pro.
                            </p>
                        )}
                        {storageFull && (
                            <p className="text-[11px] text-red-600 font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Almacenamiento lleno. Elimina archivos o actualiza al Plan Pro para continuar subiendo.
                            </p>
                        )}
                        <p className="text-[10px] text-slate-400 font-medium">
                            Límite por archivo: {maxFileSizeMb} MB
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Panel de subida */}
            <Card className={`border-dashed border-2 ${storageFull ? 'border-red-200 bg-red-50/20' : 'border-slate-200 bg-slate-50'}`}>
                <CardHeader>
                    <CardTitle className="text-lg">Subir Nuevo Archivo</CardTitle>
                    <CardDescription>
                        Formatos permitidos: Imágenes (JPG, PNG) y Documentos (PDF)
                        {storageLimitMb
                            ? ` · Máx. ${maxFileSizeMb} MB por archivo`
                            : ` · Máx. ${maxFileSizeMb} MB por archivo`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="file-upload">Archivo</Label>
                            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                <Label
                                    htmlFor="file-upload"
                                    className={`cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border h-10 px-4 py-2 shadow-sm ${storageFull
                                        ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed pointer-events-none'
                                        : 'border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-900'
                                        }`}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {selectedFile ? 'Cambiar archivo' : 'Seleccionar archivo'}
                                </Label>
                                <span className="text-sm text-gray-500 truncate max-w-full sm:max-w-[200px]">
                                    {selectedFile
                                        ? `${selectedFile.name} (${formatBytes(selectedFile.size)})`
                                        : 'Ningún archivo seleccionado'}
                                </span>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    onChange={handleFileSelect}
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    disabled={!!storageFull}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción (Opcional)</Label>
                            <Input
                                id="description"
                                placeholder="Ej: Radiografía de tórax, Análisis de sangre..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={handleUpload}
                            disabled={uploading || !selectedFile || !!storageFull}
                            className="bg-[#1c334a]"
                        >
                            {uploading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</>
                            ) : (
                                <><Upload className="mr-2 h-4 w-4" /> Subir Archivo</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de archivos */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex flex-wrap items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                    <span className="truncate">Archivos Guardados ({files.length})</span>
                    {totalUsedBytes > 0 && (
                        <span className="text-xs text-slate-400 font-normal">
                            · {formatBytes(totalUsedBytes)} en este paciente
                        </span>
                    )}
                </h3>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-10 bg-white border rounded-lg text-gray-400">
                        No hay archivos cargados para este paciente.
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-2 xl:grid-cols-3">
                        {files.map(file => {
                            const publicUrl = getFileUrl(file.file_path);
                            const thumbnailUrl = getThumbnailUrl(file.file_path);
                            return (
                                <Card key={file.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="aspect-video bg-gray-100 relative items-center justify-center flex overflow-hidden">
                                        {isImage(file.file_type) ? (
                                            <img
                                                src={thumbnailUrl}
                                                loading="lazy"
                                                alt={file.file_name}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <FileText className="w-16 h-16 text-gray-300" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button size="icon" variant="secondary" asChild title="Ver / Descargar">
                                                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                onClick={() => setFileToDelete(file)}
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardContent className="p-3 space-y-1">
                                        <div className="font-medium truncate text-sm" title={file.file_name}>
                                            {file.description || file.file_name}
                                        </div>
                                        <div className="text-xs text-gray-500 flex justify-between">
                                            <span>{format(new Date(file.created_at), "d MMM yyyy", { locale: es })}</span>
                                            <span className="text-slate-400">
                                                {file.file_size_bytes ? formatBytes(file.file_size_bytes) : file.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!fileToDelete}
                onOpenChange={(open) => !open && setFileToDelete(null)}
                title="¿Eliminar archivo?"
                description={`¿Estás seguro de que deseas eliminar permanentemente "${fileToDelete?.description || fileToDelete?.file_name}"?`}
                onConfirm={confirmDeleteFile}
                isLoading={isDeleting}
            />
        </div>
    );
};

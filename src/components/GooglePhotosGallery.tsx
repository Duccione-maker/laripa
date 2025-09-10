import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GooglePhoto {
  id: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
  mediaMetadata: {
    width: string;
    height: string;
  };
}

interface GooglePhotosGalleryProps {
  albumId: string;
  apartmentName: string;
  className?: string;
}

export function GooglePhotosGallery({ albumId, apartmentName, className }: GooglePhotosGalleryProps) {
  const [photos, setPhotos] = useState<GooglePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!albumId) return;

    const fetchPhotos = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: functionError } = await supabase.functions.invoke('google-photos-album', {
          body: { albumId }
        });

        if (functionError) {
          throw functionError;
        }

        setPhotos(data.photos || []);
      } catch (err) {
        console.error('Error fetching Google Photos:', err);
        setError(err instanceof Error ? err.message : 'Errore nel caricamento delle foto');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [albumId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Galleria Foto - {apartmentName}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Galleria Foto - {apartmentName}</h3>
          </div>
          <div className="text-center py-8">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Galleria Foto - {apartmentName}</h3>
          </div>
          <div className="text-center py-8">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessuna foto disponibile per questo appartamento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Galleria Foto - {apartmentName}</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group"
                onClick={() => setSelectedPhoto(photo.baseUrl + '=w1920-h1080')}
              >
                <img
                  src={photo.baseUrl + '=w400-h400-c'}
                  alt={photo.filename}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>

          {photos.length > 12 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Mostrando {Math.min(12, photos.length)} di {photos.length} foto
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal per foto ingrandita */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img
              src={selectedPhoto}
              alt="Foto ingrandita"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
import { supabase } from '@/lib/supabase/client';

const BUCKET_NAME = 'client-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload un document vers Supabase Storage
 * Structure: client-documents/{user_id}/{timestamp}_{filename}
 */
export async function uploadDocument(file: File): Promise<UploadResult> {
  try {
    // Validation du type de fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Format non autorisé. Utilisez PDF, PNG, JPG ou WEBP.',
      };
    }

    // Validation de la taille
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'Fichier trop volumineux. Maximum 10 Mo.',
      };
    }

    // Récupérer l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Session expirée. Veuillez vous reconnecter.',
      };
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

    // Upload vers Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Erreur upload Storage:', uploadError);
      return {
        success: false,
        error: uploadError.message || 'Erreur lors de l\'upload du fichier.',
      };
    }

    // Générer l'URL signée (valide 1 an)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(data.path, 365 * 24 * 60 * 60); // 1 an en secondes

    if (urlError) {
      console.error('Erreur génération URL:', urlError);
      // Retourner quand même le path même si l'URL échoue
      return {
        success: true,
        path: data.path,
        url: undefined,
      };
    }

    return {
      success: true,
      path: data.path,
      url: urlData.signedUrl,
    };

  } catch (err) {
    console.error('Erreur inattendue upload:', err);
    return {
      success: false,
      error: 'Une erreur inattendue est survenue.',
    };
  }
}

/**
 * Supprime un document du Storage
 */
export async function deleteDocument(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Erreur suppression:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Erreur inattendue suppression:', err);
    return false;
  }
}

/**
 * Récupère l'URL publique/signée d'un document
 */
export async function getDocumentUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 60 * 60); // 1 heure

    if (error) {
      console.error('Erreur récupération URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Erreur inattendue:', err);
    return null;
  }
}

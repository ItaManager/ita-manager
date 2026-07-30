"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { TypeMainOeuvre } from "@prisma/client";

interface Document {
  id: string;
  typeDocument: string;
  nomFichier: string;
  cheminStorage: string;
  dateUpload: Date;
  taille: number; // en octets
  estMedical: boolean;
}

interface OngletDocumentsProps {
  employeId: string;
  typeMainOeuvre: TypeMainOeuvre;
  documents: Document[];
}

// Documents obligatoires selon type employé (M2-EMPLOYES.md §2.2.3)
const DOCUMENTS_OBLIGATOIRES = {
  PERMANENT: [
    "CV",
    "CNI",
    "Diplômes",
    "Certificats de travail",
    "Casier judiciaire",
    "Certificat médical",
    "Acte de naissance",
  ],
  JOURNALIER: ["CNI", "Certificat médical"],
} as const;

// Formater la taille du fichier
function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function OngletDocuments({
  employeId,
  typeMainOeuvre,
  documents,
}: OngletDocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);

  const documentsObligatoires = DOCUMENTS_OBLIGATOIRES[typeMainOeuvre];
  const documentsFournis = new Set(documents.map((d) => d.typeDocument));
  const documentsManquants = documentsObligatoires.filter(
    (type) => !documentsFournis.has(type)
  );

  const handleUpload = async (typeDocument: string, file: File) => {
    setIsUploading(true);
    try {
      // TODO: Implémenter l'upload via Server Action
      // await uploadDocumentEmploye(employeId, typeDocument, file);
      console.log("Upload:", typeDocument, file.name);
    } catch (error) {
      console.error("Erreur upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (documentId: string, nomFichier: string) => {
    try {
      // TODO: Implémenter le download via Server Action
      // const url = await obtenirUrlDownloadDocument(documentId);
      // window.open(url, "_blank");
      console.log("Download:", documentId, nomFichier);
    } catch (error) {
      console.error("Erreur download:", error);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    try {
      // TODO: Implémenter la suppression via Server Action
      // await supprimerDocumentEmploye(documentId);
      console.log("Delete:", documentId);
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerte documents manquants */}
      {documentsManquants.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <span className="font-semibold">
              {documentsManquants.length} document
              {documentsManquants.length > 1 ? "s" : ""} manquant
              {documentsManquants.length > 1 ? "s" : ""}
            </span>
            <span className="text-muted-foreground">
              {" "}
              — {documentsManquants.join(", ")}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des types de documents */}
      {documentsObligatoires.map((typeDoc) => {
        const docsFournis = documents.filter((d) => d.typeDocument === typeDoc);
        const estManquant = docsFournis.length === 0;

        return (
          <Card key={typeDoc}>
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">{typeDoc}</h3>
                  <p className="text-xs text-muted-foreground">
                    {docsFournis.length} fichier
                    {docsFournis.length > 1 ? "s" : ""} uploadé
                    {docsFournis.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Bouton upload */}
              <label>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(typeDoc, file);
                  }}
                  disabled={isUploading}
                />
                <Button variant="outline" size="sm" asChild disabled={isUploading}>
                  <span className="cursor-pointer">
                    <Upload className="size-4 mr-2" aria-hidden="true" />
                    {estManquant ? "Ajouter" : "Remplacer"}
                  </span>
                </Button>
              </label>
            </CardHeader>

            {/* Liste des fichiers */}
            {docsFournis.length > 0 && (
              <CardContent className="p-0">
                {docsFournis.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-6 py-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="size-5 text-gray-400" aria-hidden="true" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{doc.nomFichier}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.dateUpload).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          {formaterTaille(doc.taille)}
                          {doc.estMedical && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Confidentiel
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => handleDownload(doc.id, doc.nomFichier)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Voir</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => handleDownload(doc.id, doc.nomFichier)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Télécharger</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-900 hover:bg-red-50"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}

            {/* État vide */}
            {estManquant && (
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun fichier uploadé pour ce type de document.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cliquez sur "Ajouter" pour uploader un fichier.
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

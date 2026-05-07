import { NextRequest, NextResponse } from 'next/server';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import { FileStorage } from '@/lib/file-storage';
import { AuditLogger } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectUid = searchParams.get('projectUid');

  if (!projectUid) {
    return NextResponse.json({ error: 'projectUid is required' }, { status: 400 });
  }

  try {
    const documents = DocumentRepository.getByProjectId(projectUid);
    return NextResponse.json(documents);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch documents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectUid = formData.get('projectUid') as string;
    const category = formData.get('category') as string;
    const uploadedBy = formData.get('uploadedBy') as string || 'System';
    const notes = formData.get('notes') as string || '';
    const tags = formData.get('tags') as string || '[]';

    if (!file || !projectUid || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save file to storage
    const fileInfo = await FileStorage.saveFile(file, projectUid);

    // Save metadata to DB
    const document = DocumentRepository.create({
      project_uid: projectUid,
      category,
      name: file.name,
      file_path: fileInfo.path,
      file_size: fileInfo.size,
      mime_type: fileInfo.type,
      uploaded_by: uploadedBy,
      tags,
      notes
    });

    // Log the action
    await AuditLogger.log(
      uploadedBy,
      'UPLOAD',
      'document',
      document.id,
      {},
      document
    );

    return NextResponse.json(document);
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import { FileStorage } from '@/lib/file-storage';
import { AuditLogger } from '@/lib/audit-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const document = DocumentRepository.findById(id);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json(document);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'System';

  try {
    const document = DocumentRepository.findById(id);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete file from storage
    FileStorage.deleteFile(document.file_path);

    // Delete from DB
    DocumentRepository.delete(id);

    // Log the action
    await AuditLogger.log(
      userId,
      'DELETE',
      'document',
      id,
      document,
      {}
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const data = await request.json();
    const document = DocumentRepository.findById(id);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    DocumentRepository.update(id, data);
    const updated = DocumentRepository.findById(id);

    // Log the action
    await AuditLogger.log(
      data.userId || 'System',
      'UPDATE',
      'document',
      id,
      document,
      updated
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

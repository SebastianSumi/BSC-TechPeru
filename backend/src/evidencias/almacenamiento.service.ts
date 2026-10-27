import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

@Injectable()
export class AlmacenamientoService {
  private readonly baseDir =
    process.env.STORAGE_DIR ??
    join(process.cwd(), 'storage', 'evidencias');

  async guardar(
    contenido: Buffer,
    nombreArchivo: string,
    mimeType: string,
  ): Promise<string> {
    const extension = nombreArchivo.includes('.')
      ? nombreArchivo.slice(nombreArchivo.lastIndexOf('.')).replace(/[^A-Za-z0-9.]/g, '')
      : '';
    const key = `${randomUUID()}${extension}`;
    const destino = join(this.baseDir, key);
    await mkdir(dirname(destino), { recursive: true });
    await writeFile(destino, contenido);
    return key;
  }

  async leer(key: string): Promise<Buffer> {
    try {
      return await readFile(join(this.baseDir, key));
    } catch {
      throw new NotFoundException('Archivo de evidencia no encontrado');
    }
  }

  async eliminar(key?: string | null): Promise<void> {
    if (!key) return;
    try {
      await unlink(join(this.baseDir, key));
    } catch {
      // El archivo puede haber sido eliminado previamente.
    }
  }
}

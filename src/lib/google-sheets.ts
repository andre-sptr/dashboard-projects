import { google } from 'googleapis';
import path from 'path';
import { getSpreadsheetId } from './env';

export interface SheetRow {
  [key: string]: string | number | boolean | null;
}

export class GoogleSheetsClient {
  private static getAuth() {
    const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    
    if (process.env.GOOGLE_CREDENTIALS) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        return new google.auth.GoogleAuth({
          credentials,
          scopes,
        });
      } catch (error) {
        console.error('Failed to parse GOOGLE_CREDENTIALS JSON string, falling back to file paths:', error);
      }
    }

    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      : path.join(process.cwd(), 'kunci_rahasia_google.json');

    return new google.auth.GoogleAuth({
      keyFile,
      scopes,
    });
  }

  private static auth = GoogleSheetsClient.getAuth();

  private static sheets = google.sheets({ version: 'v4', auth: this.auth });

  static async getSheetData(range: string): Promise<unknown[][]> {
    const spreadsheetId = getSpreadsheetId();
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        valueRenderOption: 'UNFORMATTED_VALUE',
      });
      return response.data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  /**
   * Finds the sheet name for a given gid (SHEET_ID)
   */
  static async getSheetNameById(gid: string): Promise<string> {
    const spreadsheetId = getSpreadsheetId();
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });
      
      const sheet = response.data.sheets?.find(
        (s) => s.properties?.sheetId?.toString() === gid
      );
      
      if (!sheet) {
        throw new Error(`Sheet with gid ${gid} not found in spreadsheet ${spreadsheetId}`);
      }
      
      return sheet.properties?.title || 'Sheet1';
    } catch (error) {
      console.error('Error getting sheet name by ID:', error);
      throw error;
    }
  }

  private static quoteSheetName(sheetName: string): string {
    return `'${sheetName.replace(/'/g, "''")}'`;
  }

  static async getRowsFromGid(gid: string, rangeOffset: string = 'A1:ZZ'): Promise<unknown[][]> {
    const sheetName = await this.getSheetNameById(gid);
    return this.getSheetData(`${this.quoteSheetName(sheetName)}!${rangeOffset}`);
  }
}

/*
 *                 Sun Public License Notice
 * 
 * This file is subject to the Sun Public License Version 
 * 1.0 (the "License"); you may not use this file except in compliance with 
 * the License. A copy of the License is available at http://www.sun.com/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 * 
 * The Original Code is sourcemap Library.
 * The Initial Developer of the Original Code is Illya Kysil.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 * 
 * Alternatively, the Library may be used under the terms of either
 * the Mozilla Public License Version 1.1 or later (the "MPL"),
 * the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * (the "Alternative License"), in which case the provisions
 * of the respective Alternative License are applicable instead of those above.
 * If you wish to allow use of your version of this Library only under
 * the terms of an Alternative License, and not to allow others to use your
 * version of this Library under the terms of the License, indicate your decision by
 * deleting the provisions above and replace them with the notice and other
 * provisions required by the Alternative License. If you do not delete
 * the provisions above, a recipient may use your version of this Library under
 * the terms of any one of the SPL, the MPL, the GPL or the LGPL.
 */
/*
 * FileInfoBuilder.java
 *
 * Created on May 3, 2004, 9:41 AM
 */

package fm.ua.ikysil.smap.parser;

import fm.ua.ikysil.smap.*;

/**
 *
 * @author  Illya Kysil
 */
public class FileInfoBuilder implements Builder {

    /** Creates a new instance of FileInfoBuilder */
    public FileInfoBuilder() {
    }

    public String getSectionName() {
        return Constants.FileSectionName;
    }

    public void build(State state, String[] lines) throws SourceMapException {
        if (!state.getStratum().getFileInfoList().isEmpty()) {
            throw new SourceMapException("Only one file section allowed");
        }
        for (int i = 1; i < lines.length;) {
            FileInfo fileInfo = new FileInfo();
            String s = lines[i++];
            String fileId = "0";
            String fileName = "";
            String filePath = "";
            if (s.startsWith("+")) {
                String[] tokens = s.split(" ", 3);
                fileId = tokens[1];
                fileName = tokens[2];
                if (i == lines.length) {
                    throw new SourceMapException("File path expected");
                }
                filePath = lines[i++];
            }
            else {
                String[] tokens = s.split(" ", 2);
                fileId = tokens[0];
                fileName = tokens[1];
                filePath = fileName;
            }
            try {
                fileInfo.setFileId(Integer.parseInt(fileId));
            }
            catch (NumberFormatException nfe) {
                throw new SourceMapException("Invalid file id: " + fileId);
            }
            fileInfo.setInputFileName(fileName);
            fileInfo.setInputFilePath(filePath);
            state.getStratum().getFileInfoList().add(fileInfo);
        }
    }

}

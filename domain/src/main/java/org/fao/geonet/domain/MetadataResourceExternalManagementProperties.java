/*
 * =============================================================================
 * ===	Copyright (C) 2001-2016 Food and Agriculture Organization of the
 * ===	United Nations (FAO-UN), United Nations World Food Programme (WFP)
 * ===	and United Nations Environment Programme (UNEP)
 * ===
 * ===	This program is free software; you can redistribute it and/or modify
 * ===	it under the terms of the GNU General Public License as published by
 * ===	the Free Software Foundation; either version 2 of the License, or (at
 * ===	your option) any later version.
 * ===
 * ===	This program is distributed in the hope that it will be useful, but
 * ===	WITHOUT ANY WARRANTY; without even the implied warranty of
 * ===	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * ===	General Public License for more details.
 * ===
 * ===	You should have received a copy of the GNU General Public License
 * ===	along with this program; if not, write to the Free Software
 * ===	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301, USA
 * ===
 * ===	Contact: Jeroen Ticheler - FAO - Viale delle Terme di Caracalla 2,
 * ===	Rome - Italy. email: geonetwork@osgeo.org
 * ==============================================================================
 */

package org.fao.geonet.domain;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "metadataResourceExternalManagementProperties")
@XmlAccessorType(XmlAccessType.FIELD)
public class MetadataResourceExternalManagementProperties {
    private final String id;
    private final String url;
    private ValidationStatus status=ValidationStatus.UNKNOWN;

    public MetadataResourceExternalManagementProperties(String id, String url) {
        this.id = id;
        this.url = url;
    }

    public String getUrl() {
            return url;
        }

    public String getId() {
            return id;
        }

    public ValidationStatus getStatus() {
        return status;
    }

    public void setStatus(ValidationStatus status) {
        this.status = status;
    }

    public static enum ValidationStatus {
        UNKNOWN(0),VALID(1), INCOMPLETE(2), WARNING(3);
        private int statusValue;

        private ValidationStatus (int statusValue) {
            this.statusValue = statusValue;
        }

        public static ValidationStatus fromValue(int value) {
            for (ValidationStatus status : values()) {
                if (status.statusValue ==value) {
                    return status;
                }
            }
            return null;
        }

        public int getValue () {
            return statusValue;
        }
    }
}



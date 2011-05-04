/*
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER.
 *
 * Copyright © 2011 ForgeRock AS. All rights reserved.
 *
 * The contents of this file are subject to the terms
 * of the Common Development and Distribution License
 * (the License). You may not use this file except in
 * compliance with the License.
 *
 * You can obtain a copy of the License at
 * http://forgerock.org/license/CDDLv1.0.html
 * See the License for the specific language governing
 * permission and limitations under the License.
 *
 * When distributing Covered Code, include this CDDL
 * Header Notice in each file and include the License file
 * at http://forgerock.org/license/CDDLv1.0.html
 * If applicable, add the following below the CDDL Header,
 * with the fields enclosed by brackets [] replaced by
 * your own identifying information:
 * "Portions Copyrighted [year] [name of copyright owner]"
 */
package org.forgerock.openidm.repo.orientdb.impl.query;

import com.orientechnologies.orient.core.Orient;
import com.orientechnologies.orient.core.db.document.ODatabaseDocumentTx;
import com.orientechnologies.orient.core.metadata.schema.OType;
import com.orientechnologies.orient.core.record.impl.ODocument;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.forgerock.openidm.objset.BadRequestException;
import org.forgerock.openidm.objset.ConflictException;

import org.testng.annotations.*;
import static org.testng.Assert.*;
import static org.fest.assertions.Assertions.assertThat;
import static org.fest.assertions.MapAssert.entry;

public class TokenHandlerTest {

    TokenHandler tokenHandler = null;
    
    @Test
    public void initTokenHandler() {
        tokenHandler = new TokenHandler();
    }
    
    @Test(dependsOnMethods = {"initTokenHandler"})
    public void replaceTokensWithValues() throws BadRequestException {
        String queryString = "select ${_fields} from ${_resource} where firstname = '${firstname}' and lastname like '${lastname}%'";
        Map params = new HashMap();
        params.put("_fields", "*");
        params.put("_resource", "managed/user");
        params.put("firstname", "John");
        params.put("lastname", "D");
        String result = tokenHandler.replaceTokensWithValues(queryString, params);
        assertEquals(result, "select * from managed/user where firstname = 'John' and lastname like 'D%'");
    }

    @Test(dependsOnMethods = {"initTokenHandler"}, expectedExceptions = BadRequestException.class )
    public void valueReplaceMissingToken() throws BadRequestException {
        String queryString = "select ${_fields} from ${_resource} where firstname = '${firstname}' and lastname like '${lastname}%'";
        Map params = new HashMap();
        params.put("_fields", "*");
        params.put("_resource", "managed/user");
        // don't define firstname, should fail
        params.put("lastname", "D");
        String result = tokenHandler.replaceTokensWithValues(queryString, params);
        assertEquals(result, "select * from managed/user where firstname = 'John' and lastname like 'D%'");
    }
    
    @Test(dependsOnMethods = {"initTokenHandler"})
    public void replaceTokensWithOrientToken() {
        String queryString = "select ${_fields} from ${_resource} where firstname = ${firstname} and lastname like ${lastname}";
        String result = tokenHandler.replaceTokensWithOrientToken(queryString);
        assertEquals(result, "select :_fields from :_resource where firstname = :firstname and lastname like :lastname");
    }
}
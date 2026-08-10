package com.productideas.security;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PasswordServiceTest {

    @Test
    void verifiesSeedAdminPassword() {
        PasswordService service = new PasswordService();
        String encrypted =
            "scrypt$demo_admin$4f9504a23148b1019f191ac8f1dd54284a31fbe56ce487378f023233e212afd51992a9783906ea34083c1f1f1d4ada72774e836fdd835bee920d5cdb44e92e54";
        assertTrue(service.verifyPassword("demo1234", encrypted));
    }
}

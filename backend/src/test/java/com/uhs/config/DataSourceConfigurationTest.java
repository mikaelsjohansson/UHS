package com.uhs.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test to verify that DataSource is configured correctly and autocommit is disabled.
 * This is a simpler test that doesn't require ID generation to work.
 */
@SpringBootTest
@ActiveProfiles("test")
class DataSourceConfigurationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void dataSource_ShouldBeConfigured() {
        assertNotNull(dataSource, "DataSource should be configured");
    }

    @Test
    void connection_ShouldHaveAutocommitDisabled() throws SQLException {
        // Given - Get a connection from the DataSource
        try (Connection connection = dataSource.getConnection()) {
            // Then - Verify autocommit is disabled
            assertFalse(connection.getAutoCommit(), 
                    "Connection should have autocommit disabled. " +
                    "If this fails, SQLite autocommit is still enabled and transactions won't work.");
        }
    }

    @Test
    void connection_CanBeRetrievedMultipleTimes() throws SQLException {
        // Given/When - Get multiple connections
        try (Connection conn1 = dataSource.getConnection();
             Connection conn2 = dataSource.getConnection()) {
            
            // Then - Both should have autocommit disabled
            assertFalse(conn1.getAutoCommit(), "First connection should have autocommit disabled");
            assertFalse(conn2.getAutoCommit(), "Second connection should have autocommit disabled");
        }
    }
}


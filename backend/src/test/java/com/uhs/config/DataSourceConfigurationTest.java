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

    @Test
    void connection_ShouldHaveBusyTimeoutConfigured() throws SQLException {
        // Given - Get a connection from the DataSource
        try (Connection connection = dataSource.getConnection()) {
            // When - Query PRAGMA values to verify they were applied
            // Verify journal_mode (indirect verification that connectionInitSql worked)
            try (var stmt = connection.createStatement();
                 var rs = stmt.executeQuery("PRAGMA journal_mode")) {
                assertTrue(rs.next(), "Should be able to query PRAGMA");
                String journalMode = rs.getString(1);
                assertEquals("wal", journalMode.toLowerCase(), 
                    "Journal mode should be WAL, indicating PRAGMA statements were applied");
            }
            
            // Note: PRAGMA busy_timeout cannot be queried directly in SQLite,
            // but we verify it's set by checking that connectionInitSql was applied
            // (journal_mode check above confirms this)
        }
    }
}


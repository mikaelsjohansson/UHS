package com.uhs.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;

@Configuration
public class SqliteDataSourceConfig {

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setDriverClassName("org.sqlite.JDBC");
        
        // Set PRAGMA statements
        config.setConnectionInitSql("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON;");
        
        config.setMaximumPoolSize(10);
        config.setConnectionTimeout(30000);
        
        // Create DataSource - HikariDataSource starts immediately upon construction
        HikariDataSource dataSource = new HikariDataSource(config);
        
        // Wrap DataSource to disable autocommit on all connections
        // This is necessary because SQLite JDBC driver has autocommit enabled by default
        // and we can't modify HikariConfig after the pool starts
        return new AutocommitDisablingDataSource(dataSource);
    }
    
    /**
     * DataSource wrapper that ensures autocommit is disabled on all connections.
     * This works with HikariCP's connection lifecycle.
     */
    private static class AutocommitDisablingDataSource implements DataSource {
        private final HikariDataSource delegate;
        
        public AutocommitDisablingDataSource(HikariDataSource delegate) {
            this.delegate = delegate;
        }
        
        @Override
        public Connection getConnection() throws SQLException {
            Connection conn = delegate.getConnection();
            // Disable autocommit if it's enabled
            if (conn.getAutoCommit()) {
                conn.setAutoCommit(false);
            }
            return conn;
        }

        @Override
        public Connection getConnection(String username, String password) throws SQLException {
            Connection conn = delegate.getConnection(username, password);
            if (conn.getAutoCommit()) {
                conn.setAutoCommit(false);
            }
            return conn;
        }

        @Override
        public <T> T unwrap(Class<T> iface) throws SQLException {
            return delegate.unwrap(iface);
        }

        @Override
        public boolean isWrapperFor(Class<?> iface) throws SQLException {
            return delegate.isWrapperFor(iface);
        }

        @Override
        public java.io.PrintWriter getLogWriter() throws SQLException {
            return delegate.getLogWriter();
        }

        @Override
        public void setLogWriter(java.io.PrintWriter out) throws SQLException {
            delegate.setLogWriter(out);
        }

        @Override
        public void setLoginTimeout(int seconds) throws SQLException {
            delegate.setLoginTimeout(seconds);
        }

        @Override
        public int getLoginTimeout() throws SQLException {
            return delegate.getLoginTimeout();
        }

        @Override
        public java.util.logging.Logger getParentLogger() throws SQLFeatureNotSupportedException {
            return delegate.getParentLogger();
        }
    }
}


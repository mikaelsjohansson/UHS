package com.uhs.repository;

import com.uhs.model.FirstTimeLoginToken;
import com.uhs.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for FirstTimeLoginToken entity - Phase 1A of user management system.
 * Provides data access methods for token management operations.
 */
@Repository
public interface FirstTimeLoginTokenRepository extends JpaRepository<FirstTimeLoginToken, Long> {

    /**
     * Find a token by its unique token value.
     * @param token the token string to search for
     * @return Optional containing the token if found
     */
    Optional<FirstTimeLoginToken> findByToken(String token);

    /**
     * Find all tokens for a specific user.
     * @param user the user to find tokens for
     * @return list of tokens associated with the user
     */
    List<FirstTimeLoginToken> findByUser(User user);

    /**
     * Find all tokens for a specific user by user ID.
     * @param userId the user ID to find tokens for
     * @return list of tokens associated with the user
     */
    List<FirstTimeLoginToken> findByUserId(Long userId);

    /**
     * Find valid (unused and not expired) token by token value.
     * @param token the token string to search for
     * @param now the current datetime for expiration check
     * @return Optional containing the valid token if found
     */
    @Query("SELECT t FROM FirstTimeLoginToken t WHERE t.token = :token AND t.used = false AND t.expiresAt > :now")
    Optional<FirstTimeLoginToken> findValidToken(@Param("token") String token, @Param("now") LocalDateTime now);

    /**
     * Find all unused tokens that have expired.
     * @param now the current datetime for expiration check
     * @return list of expired but unused tokens
     */
    @Query("SELECT t FROM FirstTimeLoginToken t WHERE t.used = false AND t.expiresAt <= :now")
    List<FirstTimeLoginToken> findExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Check if a valid (unused and not expired) token exists.
     * @param token the token string to check
     * @param now the current datetime for expiration check
     * @return true if a valid token exists
     */
    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM FirstTimeLoginToken t WHERE t.token = :token AND t.used = false AND t.expiresAt > :now")
    boolean existsValidToken(@Param("token") String token, @Param("now") LocalDateTime now);

    /**
     * Delete all tokens for a specific user.
     * @param userId the user ID to delete tokens for
     */
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
}

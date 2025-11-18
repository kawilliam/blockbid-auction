package com.blockbid.itemservice.repository;

import com.blockbid.itemservice.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    
    // Find active items
    List<Item> findByStatusOrderByCreatedAtDesc(String status);
    
    // Search by keyword in name or description
    @Query("SELECT i FROM Item i WHERE " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND i.status = 'ACTIVE' " +
           "ORDER BY i.createdAt DESC")
    List<Item> searchByKeyword(@Param("keyword") String keyword);
    
    // Find by category
    List<Item> findByCategoryAndStatusOrderByCreatedAtDesc(String category, String status);
    
    // Find by seller
    List<Item> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
    
    // Find items ending soon
    @Query("SELECT i FROM Item i WHERE " +
           "i.status = 'ACTIVE' AND " +
           "i.endTime BETWEEN :now AND :threshold " +
           "ORDER BY i.endTime ASC")
    List<Item> findItemsEndingSoon(@Param("now") LocalDateTime now, 
                                   @Param("threshold") LocalDateTime threshold);
    
    // Find expired items that need status update
    @Query("SELECT i FROM Item i WHERE " +
           "i.status = 'ACTIVE' AND " +
           "i.endTime < :now")
    List<Item> findExpiredItems(@Param("now") LocalDateTime now);
    
    // Count active items by seller
    long countBySellerIdAndStatus(Long sellerId, String status);
}
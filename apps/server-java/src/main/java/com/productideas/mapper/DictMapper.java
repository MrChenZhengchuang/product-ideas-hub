package com.productideas.mapper;

import com.productideas.domain.DictItemNode;
import com.productideas.domain.DictTypeItem;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface DictMapper {

    long countDictTypes(@Param("keyword") String keyword, @Param("status") String status);

    List<DictTypeItem> listDictTypes(
        @Param("keyword") String keyword,
        @Param("status") String status,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    long countDictItems(
        @Param("dictTypeId") long dictTypeId,
        @Param("keyword") String keyword,
        @Param("status") String status
    );

    List<DictItemNode> listDictItemsFiltered(
        @Param("dictTypeId") long dictTypeId,
        @Param("keyword") String keyword,
        @Param("status") String status,
        @Param("limit") Integer limit,
        @Param("offset") Integer offset
    );

    @Insert("""
        INSERT INTO dict_types (name, code, value_type, status, sort_order, remark)
        VALUES (#{name}, #{code}, #{valueType}, #{status}, #{sortOrder}, #{remark})
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertDictType(DictTypeItem item);

    @Update("""
        UPDATE dict_types
        SET name = #{name}, code = #{code}, value_type = #{valueType}, status = #{status}, sort_order = #{sortOrder}, remark = #{remark}
        WHERE id = #{id}
        """)
    int updateDictType(DictTypeItem item);

    @Select("SELECT COUNT(*) FROM dict_items WHERE dict_type_id = #{dictTypeId}")
    long countItemsByDictTypeId(@Param("dictTypeId") long dictTypeId);

    @Delete("DELETE FROM dict_types WHERE id = #{id}")
    int deleteDictType(@Param("id") long id);

    @Insert("""
        INSERT INTO dict_items (dict_type_id, parent_id, label, value, status, sort_order, remark)
        VALUES (#{dictTypeId}, #{parentId}, #{label}, #{value}, #{status}, #{sortOrder}, #{remark})
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertDictItem(DictItemNode item);

    @Update("""
        UPDATE dict_items
        SET dict_type_id = #{dictTypeId}, parent_id = #{parentId}, label = #{label}, value = #{value}, status = #{status}, sort_order = #{sortOrder}, remark = #{remark}
        WHERE id = #{id}
        """)
    int updateDictItem(DictItemNode item);

    @Select("SELECT COUNT(*) FROM dict_items WHERE parent_id = #{id}")
    long countChildDictItems(@Param("id") long id);

    @Delete("DELETE FROM dict_items WHERE id = #{id}")
    int deleteDictItem(@Param("id") long id);
}

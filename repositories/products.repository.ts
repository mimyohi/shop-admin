import { supabaseServer as supabase } from "@/lib/supabase-server";
import { Product, RepresentativeOption } from "@/models";
import {
  ProductFilters,
  CreateProductData,
  UpdateProductData,
} from "@/types/products.types";

/**
 * 상품 ID 목록에 대한 대표 옵션 조회
 */
async function fetchRepresentativeOptions(
  productIds: string[]
): Promise<Map<string, RepresentativeOption>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("product_options")
    .select("id, product_id, name, price, discount_rate")
    .in("product_id", productIds)
    .eq("is_representative", true)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching representative options:", error);
    return new Map();
  }

  const map = new Map<string, RepresentativeOption>();
  data?.forEach((option) => {
    if (option.product_id) {
      const discountRate = option.discount_rate || 0;
      const discountedPrice =
        discountRate > 0
          ? Math.floor(option.price * (1 - discountRate / 100))
          : option.price;

      map.set(option.product_id, {
        id: option.id,
        name: option.name,
        price: option.price,
        discount_rate: discountRate,
        discounted_price: discountedPrice,
      });
    }
  });

  return map;
}

export const productsRepository = {
  /**
   * 상품 목록 조회 (관리자용)
   */
  async findMany(filters: ProductFilters = {}) {
    const { search, category, page = 1, limit = 20, isVisibleOnMain } = filters;

    const shouldPaginate = limit !== "all";
    const numericLimit = typeof limit === "number" ? limit : undefined;
    const from = shouldPaginate
      ? (page - 1) * (numericLimit as number)
      : undefined;
    const to =
      shouldPaginate && numericLimit ? from! + numericLimit - 1 : undefined;

    let query = supabase.from("products").select("*", { count: "exact" });

    // Soft delete된 상품 제외
    query = query.is("deleted_at", null);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (typeof isVisibleOnMain === "boolean") {
      query = query.eq("is_visible_on_main", isVisibleOnMain);
    }

    query = query.order("created_at", { ascending: false });

    if (shouldPaginate && typeof from === "number" && typeof to === "number") {
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to fetch products");
    }

    const products = data || [];
    const productIds = products.map((p: any) => p.id);

    // 대표 옵션 조회
    const representativeOptions = await fetchRepresentativeOptions(productIds);

    // 상품에 대표 옵션 정보 매핑
    const mappedProducts = products.map((p: any) => ({
      ...p,
      representative_option: representativeOptions.get(p.id),
    }));

    const totalCount =
      shouldPaginate && typeof count === "number"
        ? count
        : count ?? data?.length ?? 0;

    const calculatedPages =
      shouldPaginate && numericLimit ? Math.ceil(totalCount / numericLimit) : 1;

    return {
      products: mappedProducts,
      totalCount,
      totalPages: Math.max(1, calculatedPages),
      currentPage: shouldPaginate ? page : 1,
    };
  },

  /**
   * 상품 상세 조회
   */
  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return null;
    }

    return data as any;
  },

  /**
   * 상품 생성
   */
  async create(productData: CreateProductData): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      throw new Error("Failed to create product");
    }

    return data as any;
  },

  /**
   * 상품 수정
   */
  async update(id: string, updateData: UpdateProductData): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      throw new Error("Failed to update product");
    }

    return data as any;
  },

  /**
   * 상품 삭제 (Soft Delete)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      throw new Error("Failed to delete product");
    }
  },

  /**
   * 카테고리 목록 조회
   */
  async findCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from("products")
      .select("category")
      .not("category", "is", null)
      .is("deleted_at", null);

    if (error) {
      console.error("Error fetching categories:", error);
      throw new Error("Failed to fetch categories");
    }

    const uniqueCategories = Array.from(
      new Set(data?.map((item) => item.category).filter(Boolean))
    ) as string[];

    return uniqueCategories;
  },

  /**
   * 상품 품절 상태 토글
   */
  async toggleOutOfStock(id: string, isOutOfStock: boolean): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update({
        is_out_of_stock: isOutOfStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling product out of stock:", error);
      throw new Error("Failed to toggle product out of stock");
    }

    return data as any;
  },

  /**
   * NEW 뱃지 토글
   */
  async toggleNewBadge(id: string, isNewBadge: boolean): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update({
        is_new_badge: isNewBadge,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling product new badge:", error);
      throw new Error("Failed to toggle product new badge");
    }

    return data as any;
  },

  /**
   * SALE 뱃지 토글
   */
  async toggleSaleBadge(id: string, isSaleBadge: boolean): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update({
        is_sale_badge: isSaleBadge,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling product sale badge:", error);
      throw new Error("Failed to toggle product sale badge");
    }

    return data as any;
  },

  /**
   * 상품 복제
   */
  async duplicate(id: string): Promise<Product> {
    // 1. 원본 상품 정보 가져오기
    const { data: originalProduct, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !originalProduct) {
      console.error("Error fetching original product:", fetchError);
      throw new Error("Failed to fetch original product");
    }

    // 2. 새 상품 생성 (slug는 자동 생성됨)
    const {
      id: _,
      slug: __,
      created_at: ___,
      updated_at: ____,
      ...productData
    } = originalProduct;
    const newProductData = {
      ...productData,
      name: `${originalProduct.name} (복사)`,
      is_visible_on_main: false, // 복사본은 기본적으로 숨김
    };

    const { data: newProduct, error: createError } = await supabase
      .from("products")
      .insert(newProductData)
      .select()
      .single();

    if (createError || !newProduct) {
      console.error("Error creating duplicate product:", createError);
      throw new Error("Failed to create duplicate product");
    }

    // 3. 옵션 복사 (삭제되지 않은 것만)
    const { data: options, error: optionsError } = await supabase
      .from("product_options")
      .select("*")
      .eq("product_id", id)
      .is("deleted_at", null);

    if (!optionsError && options && options.length > 0) {
      for (const option of options) {
        const {
          id: optionId,
          product_id: _,
          slug: __,  // ← slug도 제외하여 자동 생성되도록 함
          created_at: ___,
          updated_at: ____,
          ...optionData
        } = option;

        const { data: newOption, error: newOptionError } = await supabase
          .from("product_options")
          .insert({ ...optionData, product_id: newProduct.id })
          .select()
          .single();

        // 에러 발생 시 즉시 중단 및 롤백
        if (newOptionError) {
          console.error("Error duplicating option:", newOptionError);
          await supabase.from("products").delete().eq("id", newProduct.id);
          throw new Error(`Failed to duplicate option: ${newOptionError.message}`);
        }

        if (!newOptionError && newOption) {
          // 4. 옵션 Settings 복사
          const { data: settings, error: settingsError } = await supabase
            .from("product_option_settings")
            .select("*")
            .eq("option_id", optionId);

          if (!settingsError && settings && settings.length > 0) {
            for (const setting of settings) {
              const {
                id: settingId,
                option_id: _,
                created_at: ___,
                updated_at: ____,
                ...settingData
              } = setting;

              const { data: newSetting, error: newSettingError } =
                await supabase
                  .from("product_option_settings")
                  .insert({ ...settingData, option_id: newOption.id })
                  .select()
                  .single();

              // Settings 복사 실패 시 롤백
              if (newSettingError) {
                console.error("Error duplicating setting:", newSettingError);
                await supabase.from("products").delete().eq("id", newProduct.id);
                throw new Error(`Failed to duplicate setting: ${newSettingError.message}`);
              }

              if (!newSettingError && newSetting) {
                // 5. Setting Types 복사
                const { data: types, error: typesError } = await supabase
                  .from("product_option_setting_types")
                  .select("*")
                  .eq("setting_id", settingId);

                if (!typesError && types && types.length > 0) {
                  const newTypes = types.map(
                    ({
                      id: _,
                      setting_id: __,
                      created_at: ___,
                      updated_at: ____,
                      ...typeData
                    }) => ({
                      ...typeData,
                      setting_id: newSetting.id,
                    })
                  );

                  const { error: typesInsertError } = await supabase
                    .from("product_option_setting_types")
                    .insert(newTypes);

                  // Types 복사 실패 시 롤백
                  if (typesInsertError) {
                    console.error("Error duplicating types:", typesInsertError);
                    await supabase.from("products").delete().eq("id", newProduct.id);
                    throw new Error(`Failed to duplicate types: ${typesInsertError.message}`);
                  }
                }
              }
            }
          }
        }
      }
    }

    // 5. 추가상품 복사
    const { data: addons, error: addonsError } = await supabase
      .from("product_addons")
      .select("*")
      .eq("product_id", id);

    if (!addonsError && addons && addons.length > 0) {
      const newAddons = addons.map(
        ({
          id: _,
          product_id: __,
          created_at: ___,
          updated_at: ____,
          ...addonData
        }) => ({
          ...addonData,
          product_id: newProduct.id,
        })
      );

      const { error: addonsInsertError } = await supabase
        .from("product_addons")
        .insert(newAddons);

      // Addons 복사 실패 시 롤백
      if (addonsInsertError) {
        console.error("Error duplicating addons:", addonsInsertError);
        await supabase.from("products").delete().eq("id", newProduct.id);
        throw new Error(`Failed to duplicate addons: ${addonsInsertError.message}`);
      }
    }

    return newProduct as any;
  },
};

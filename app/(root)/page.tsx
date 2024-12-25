import ProductList from "@/components/product/product-list";
import sampleData from "@/db/sample-data";

const HomePage = () => {
  return (
    <>
      <ProductList data={sampleData.products} title="Newest Arrivals"
      limit={4}
      />
    </>
  );
};

export default HomePage;

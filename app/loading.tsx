import Image from "next/image";
import loader from "@/assets/loader.gif";

const LoadingPage = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <Image src={loader} alt="Loading..." height={150} width={150} />
    </div>
  );
};

export default LoadingPage;

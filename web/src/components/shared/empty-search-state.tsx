import {DotLottieReact} from "@lottiefiles/dotlottie-react";


const NotFoundSearch = () => {
  const searchAnimationSrc = new URL('../../assets/lottie/search.lottie', import.meta.url).href;

  return (
      <div className="flex justify-center items-center min-h-50">
          <DotLottieReact className="h-50 w-50" src={searchAnimationSrc} autoplay loop />
      </div>
  );
}

export default NotFoundSearch;

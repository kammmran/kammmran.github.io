<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mentorcorp Carousel</title>
  <style>
	/* Container for scrolling images */
.project-content img{
max-width:auto;
}
.carousel-container .carousel-image {
  width: 250px;
  max-width: none; /* Ensures the image width is exactly 250px */
  height: auto;
  scroll-snap-align: start;
  border-radius: 8px;
  transition: transform 0.2s;
}


	.carousel-container {
  	display: flex;
  	overflow-x: auto;
  	padding: 10px;
  	gap: 10px;
  	scroll-snap-type: x mandatory;
  	white-space: nowrap;
  	background-color: #f7f7f7;
  	border-radius: 12px;
  	box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
	}

	/* Individual images within the carousel */
	.carousel-image {
  	width: 250px; /* Each image is set to exactly 250px width */
  	height: auto;
  	scroll-snap-align: start;
  	border-radius: 8px;
  	transition: transform 0.2s;
	}

	/* Hover effect for images */
	.carousel-image:hover {
  	transform: scale(1.05); /* Slight zoom effect on hover */
	}

	/* Optional: Hide scrollbar */
	.carousel-container::-webkit-scrollbar {
  	display: none;
	}

	/* Text styling */
	h2, p {
  	font-family: Arial, sans-serif;
  	color: #333;
	}
  </style>
</head>
<body>

  <p>Mentorcorp is a specialized consultancy group dedicated to enhancing management practices through targeted mentorship and in-depth research. As the "Management Mentorship Research Group," Mentorcorp provides expert mentoring to help organizations overcome complex management challenges. They conduct comprehensive research into best practices, emerging trends, and innovative strategies within the management sector.</p>

  <p>By collaborating with Mentorcorp, companies gain access to a wealth of knowledge and resources designed to enhance leadership capabilities, improve operational efficiency, and ensure sustainable development. Mentorcorp's team of seasoned experts works closely with clients to understand their unique needs and delivers tailored mentorship programs along with actionable insights that support organizations in achieving their strategic goals.</p>

  <h2>Mentorcorp: Our Services and Insights</h2>
  <div class="carousel-container">
	<a href="https://drive.google.com/file/d/1kKRe_xwLA1a_Lu226WL0-wojfb79M1SN/view?usp=sharing" target="_blank">
  	<img src="https://i.ibb.co/z8FX512/mentorcorp-1.png" alt="Mentorcorp Service -1" class="carousel-image">
	</a>
	<a href="https://example.com/service-2" target="_blank">
  	<img src="https://i.ibb.co/YbRfspX/mentorcorp-2.jpg" alt="Mentorcorp Service 0" class="carousel-image">
	</a>
	<a href="https://drive.google.com/file/d/16ye40RdXX0fKIW5Z52qzIZEakynJMW-j/view?usp=sharing" target="_blank">
  	<img src="https://i.ibb.co/HCM2cBR/mentorcorp-3.png" alt="Mentorcorp Service 1" class="carousel-image">
	</a>
	<a href="https://drive.google.com/file/d/1kGO-ToXwGxzueb4e_ssjX9-2qaiWYI4B/view?usp=sharing" target="_blank">
  	<img src="https://i.ibb.co/gVHNsTF/mentorcorp-4.png" alt="Mentorcorp Service 2" class="carousel-image">
	</a>
	<a href="https://drive.google.com/file/d/1i1WOtS65SGNR2n4fDk7F4v6WUQjySNSC/view?usp=sharing" target="_blank">
  	<img src="https://i.ibb.co/XWSgQJ4/mentorcorp-5.png" alt="Mentorcorp Service 3" class="carousel-image">
	</a>
	<a href="https://drive.google.com/file/d/1i1WOtS65SGNR2n4fDk7F4v6WUQjySNSC/view?usp=sharing" target="_blank">
  	<img src="https://i.ibb.co/LZ3wP6S/mentorcorp-6.png" alt="Mentorcorp Service 4" class="carousel-image">
	</a>
	<a href="httpshttps://drive.google.com/file/d/1GGbqEeba4ELwt5lfErEyPDvRyq8tGBB5/view?usp=sharing" target="_blank">
  	<img src="https://i.ibb.co/58FP1jy/mentorcorp-7.jpg" alt="Mentorcorp Service 5" class="carousel-image">
	</a>
  </div>

</body>
</html>
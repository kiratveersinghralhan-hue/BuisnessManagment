/* Applied Linear Algebra and Calculus (26BBM1103): built from CULMS Lectures 1–16 (Dr. Gurpreet Singh's course). Every numeric answer is checked with numpy. */
window.SUBJECT_DATA = window.SUBJECT_DATA || {};
window.SUBJECT_DATA.alac = {
"units": [
{
"id": "u1",
"name": "Unit 1",
"title": "Matrices, systems & decompositions",
"lectures": "L1–11 · 20%",
"w": 20
},
{
"id": "u2",
"name": "Unit 2",
"title": "Eigenvalues & spectral theory",
"lectures": "L12–16 · 15%",
"w": 15
}
],
"notes": [
{
"id": "la-ops",
"unit": "u1",
"lec": "L1–2",
"title": "Matrices and matrix operations",
"sum": "Order, types of matrices, equality, addition, scalar multiplication, matrix multiplication (row × column), when a product is defined, and why AB ≠ BA.",
"html": "\n<div class=\"tip\">From Lecture 1 (Matrix Operations) and Tutorial 4 on CULMS.</div>\n<h3>What is a matrix?</h3><p>A <b>matrix</b> is a rectangular arrangement of numbers in rows and columns. A matrix with <b>m rows and n columns</b> has <b>order m × n</b>. The entry in row i, column j is written <b>a<sub>ij</sub></b>.</p>\n<div class=\"mxline\"><b>A</b> = <table class=\"mx\"><tr><td>2</td><td>1</td><td>3</td></tr><tr><td>0</td><td>4</td><td>5</td></tr></table>  has order <b>2 × 3</b>; a<sub>12</sub> = 1, a<sub>23</sub> = 5.</div>\n<h3>Types you must name correctly</h3>\n<table><tr><th>Type</th><th>Rule</th><th>Example</th></tr>\n<tr><td>Row / column matrix</td><td>1 × n / m × 1</td><td>[3 5 7] / a single column</td></tr>\n<tr><td>Square</td><td>m = n</td><td>2 × 2, 3 × 3</td></tr>\n<tr><td>Zero (null) O</td><td>every entry 0</td><td>[0 0; 0 0]</td></tr>\n<tr><td>Diagonal</td><td>square, all off-diagonal entries 0</td><td>[4 0; 0 7]</td></tr>\n<tr><td>Scalar</td><td>diagonal with equal diagonal entries</td><td>[5 0; 0 5]</td></tr>\n<tr><td>Identity I</td><td>diagonal with 1s</td><td>[1 0; 0 1]</td></tr>\n<tr><td>Upper / lower triangular</td><td>zeros below / above the diagonal</td><td>[2 5; 0 3] is upper</td></tr></table>\n<h3>Addition, subtraction and scalar multiplication</h3>\n<ul><li>A ± B is defined only when A and B have the <b>same order</b>: add entry by entry.</li>\n<li>kA multiplies <b>every</b> entry by k.</li>\n<li>Laws: A + B = B + A, (A + B) + C = A + (B + C), k(A + B) = kA + kB.</li></ul>\n<h3>Matrix multiplication: row × column</h3>\n<p>AB is defined only when <b>columns of A = rows of B</b>. If A is m × n and B is n × p, then AB is <b>m × p</b>. Entry (AB)<sub>ij</sub> = row i of A · column j of B.</p>\n<div class=\"mxline\"><b>A</b> = <table class=\"mx\"><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>  <b>B</b> = <table class=\"mx\"><tr><td>0</td><td>1</td></tr><tr><td>2</td><td>1</td></tr></table> </div>\n<pre class=\"code\">AB row 1 = (1·0 + 2·2, 1·1 + 2·1) = (4, 3)\nAB row 2 = (3·0 + 4·2, 3·1 + 4·1) = (8, 7)      AB = [4 3; 8 7]\nBA row 1 = (0·1 + 1·3, 0·2 + 1·4) = (3, 4)\nBA row 2 = (2·1 + 1·3, 2·2 + 1·4) = (5, 8)      BA = [3 4; 5 8]  ≠ AB</pre>\n<h3>Properties of multiplication</h3>\n<ul><li><b>Not commutative:</b> in general AB ≠ BA (and one may exist when the other doesn't).</li>\n<li>Associative: (AB)C = A(BC). Distributive: A(B + C) = AB + AC.</li>\n<li>AI = IA = A. AO = O.</li>\n<li>AB = O does <b>not</b> mean A = O or B = O.</li></ul>\n<h3>Business use</h3>\n<p>A shop sells quantities Q = [20 15 10] of three items at prices P = [50; 80; 120] (column). Revenue = QP = 20·50 + 15·80 + 10·120 = <b>₹3,400</b>. A (1 × 3)(3 × 1) product is a 1 × 1 matrix: a single total.</p>\n<div class=\"tip\"><b>Exam habit:</b> always write the order check first, e.g. “A is 2 × 3, B is 3 × 2, so AB exists and is 2 × 2.”</div>\n"
},
{
"id": "la-trans",
"unit": "u1",
"lec": "L3, L5",
"title": "Transpose, symmetric matrices and the inverse",
"sum": "Aᵀ, (AB)ᵀ = BᵀAᵀ, symmetric and skew-symmetric matrices, invertible vs singular, inverse by Gauss–Jordan on [A | I] and the 2 × 2 shortcut.",
"html": "\n<div class=\"tip\">From Lecture 3 (Transpose, Symmetric, Inverse) and Tutorial 5.</div>\n<h3>Transpose</h3><p><b>Aᵀ</b> swaps rows and columns: row i of A becomes column i of Aᵀ. An m × n matrix gives an n × m transpose.</p>\n<ul><li>(Aᵀ)ᵀ = A · (A + B)ᵀ = Aᵀ + Bᵀ · (kA)ᵀ = kAᵀ</li><li><b>(AB)ᵀ = BᵀAᵀ</b>: the order reverses.</li></ul>\n<h3>Symmetric and skew-symmetric</h3>\n<table><tr><th></th><th>Rule</th><th>Diagonal</th><th>Example</th></tr>\n<tr><td>Symmetric</td><td>Aᵀ = A (a<sub>ij</sub> = a<sub>ji</sub>)</td><td>anything</td><td>[3 7; 7 3]</td></tr>\n<tr><td>Skew-symmetric</td><td>Aᵀ = −A (a<sub>ij</sub> = −a<sub>ji</sub>)</td><td>must be 0</td><td>[0 4; −4 0]</td></tr></table>\n<p>Any square A = ½(A + Aᵀ) + ½(A − Aᵀ): a symmetric part plus a skew-symmetric part.</p>\n<h3>Inverse</h3><p>A square matrix A is <b>invertible (non-singular)</b> if there is A⁻¹ with AA⁻¹ = A⁻¹A = I. This happens exactly when <b>det(A) ≠ 0</b>.</p>\n<h3>Gauss–Jordan method</h3><ol><li>Write the augmented matrix [A | I].</li><li>Use row operations (swap rows, multiply a row by a non-zero number, add a multiple of one row to another) until the left block is I.</li><li>The right block is A⁻¹. If a zero row appears on the left, A has no inverse.</li></ol>\n<pre class=\"code\">A = [2 5; 1 3]\n[2 5 | 1 0]   R1 ↔ R2      [1 3 | 0 1]\n[1 3 | 0 1]  ─────────►    [2 5 | 1 0]\nR2 → R2 − 2R1:             [0 −1 | 1 −2]\nR2 → −R2:                  [0  1 | −1 2]\nR1 → R1 − 3R2:             [1  0 | 3 −5]\nA⁻¹ = [3 −5; −1 2]     Check: AA⁻¹ = I ✓</pre>\n<h3>2 × 2 shortcut</h3><p>For A = [a b; c d] with ad − bc ≠ 0: <b>A⁻¹ = (1 / (ad − bc)) · [d −b; −c a]</b> (swap the diagonal, change the sign of the other two).</p>\n<ul><li>(A⁻¹)⁻¹ = A · <b>(AB)⁻¹ = B⁻¹A⁻¹</b> · (Aᵀ)⁻¹ = (A⁻¹)ᵀ · (kA)⁻¹ = (1/k)A⁻¹</li></ul>\n<div class=\"tip\"><b>Exam habit:</b> always finish an inverse with “Check: AA⁻¹ = I ✓”. Markers give a verification mark.</div>\n"
},
{
"id": "la-det",
"unit": "u1",
"lec": "L4–5",
"title": "Determinants and rank",
"sum": "2 × 2 and 3 × 3 determinants by cofactor expansion, properties, singular matrices, and rank by row echelon form.",
"html": "\n<div class=\"tip\">From Lecture 4 (Determinants and Rank) and Tutorial 5.</div>\n<h3>Determinant of a 2 × 2</h3><p>|A| = <b>a<sub>11</sub>a<sub>22</sub> − a<sub>12</sub>a<sub>21</sub></b>. For [5 3; 4 2]: 10 − 12 = −2.</p>\n<h3>Determinant of a 3 × 3: cofactor expansion</h3><p>Expand along any row or column with signs <b>+ − + / − + − / + − +</b>. Each entry is multiplied by the determinant of the 2 × 2 left after deleting its row and column (its <b>minor</b>).</p>\n<pre class=\"code\">A = [1 2 0; 3 1 4; 0 2 1]   (expand along row 1)\n|A| = 1·|1 4; 2 1| − 2·|3 4; 0 1| + 0\n    = 1(1 − 8) − 2(3 − 0) = −7 − 6 = −13</pre>\n<p><b>Tip:</b> expand along the row or column with the most zeros.</p>\n<h3>Properties</h3><ul>\n<li>|Aᵀ| = |A| · |AB| = |A||B| · |A⁻¹| = 1/|A|</li>\n<li>Swapping two rows changes the sign. A row of zeros, or two equal / proportional rows, gives |A| = 0.</li>\n<li>Multiplying one row by k multiplies |A| by k, so for an n × n matrix <b>|kA| = kⁿ|A|</b>.</li>\n<li>Adding a multiple of one row to another leaves |A| unchanged.</li>\n<li>Triangular matrix: |A| = product of the diagonal.</li></ul>\n<h3>Singular vs non-singular</h3><p><b>|A| = 0 ⟺ singular</b> (no inverse, rows dependent). |A| ≠ 0 ⟺ non-singular ⟺ rank = n.</p>\n<h3>Rank</h3><p>Reduce A to <b>row echelon form</b> (a staircase: each leading entry is to the right of the one above, zero rows at the bottom). <b>Rank = number of non-zero rows.</b> It is the number of linearly independent rows (or columns), and works for rectangular matrices too.</p>\n<pre class=\"code\">[1 0 2; 2 1 3; 3 1 5]\nR2 → R2 − 2R1: (0, 1, −1)\nR3 → R3 − 3R1: (0, 1, −1)\nR3 → R3 − R2 : (0, 0, 0)      → 2 non-zero rows, rank = 2</pre>\n<ul><li>rank(A) ≤ min(m, n). rank(O) = 0.</li><li>An n × n matrix has rank n exactly when |A| ≠ 0.</li></ul>\n"
},
{
"id": "la-gauss",
"unit": "u1",
"lec": "L6, L8",
"title": "Systems of equations and Gaussian elimination",
"sum": "AX = B, the augmented matrix, forward elimination and back-substitution, and the rank test for unique, infinite or no solutions.",
"html": "\n<div class=\"tip\">From Lecture 6 (Gaussian Elimination) and Tutorial 6.</div>\n<h3>Matrix form</h3><p>m equations in n unknowns become <b>AX = B</b>: A = coefficient matrix, X = column of unknowns, B = constants. The <b>augmented matrix</b> is [A | B].</p>\n<h3>Gaussian elimination</h3><ol><li><b>Forward elimination:</b> use row operations on [A | B] to reach row echelon form (zeros below each pivot).</li><li><b>Back-substitution:</b> solve the last equation first, then move upwards.</li></ol>\n<pre class=\"code\">x + y + z = 6,  x − y + 2z = 5,  2x + y − z = 1\n[1  1  1 | 6]\n[1 −1  2 | 5]   R2 → R2 − R1 :  [0 −2  1 | −1]\n[2  1 −1 | 1]   R3 → R3 − 2R1:  [0 −1 −3 | −11]\n                R3 → R3 − ½R2:  [0  0 −3.5 | −10.5]  ⇒ z = 3\nBack-sub: −2y + 3 = −1 ⇒ y = 2;  x + 2 + 3 = 6 ⇒ x = 1</pre>\n<h3>How many solutions? The rank test</h3>\n<table><tr><th>Condition (n unknowns)</th><th>Result</th></tr>\n<tr><td>rank(A) = rank[A | B] = n</td><td><b>Unique</b> solution (consistent)</td></tr>\n<tr><td>rank(A) = rank[A | B] &lt; n</td><td><b>Infinitely many</b> solutions (consistent)</td></tr>\n<tr><td>rank(A) ≠ rank[A | B]</td><td><b>No</b> solution (inconsistent): a row reads 0 = non-zero</td></tr></table>\n<p>Example: x + y = 3, 2x + 2y = 10 → R2 − 2R1 gives 0 = 4, so <b>no solution</b>. x + 2y = 4, 2x + 4y = 8 → 0 = 0, so <b>infinitely many</b>.</p>\n<h3>Homogeneous systems AX = 0</h3><p>Always consistent (x = y = z = 0 works). If rank(A) = n, only the trivial solution; if rank(A) &lt; n (|A| = 0 for square A), infinitely many non-trivial solutions.</p>\n<h3>Business word problems</h3><p>A shop sells boxes P, Q, R at ₹x, ₹y, ₹z hundred. One of each costs 7; two P + one Q + one R cost 10; one P + two Q + one R cost 9. Solving gives x = 3, y = 2, z = 2, i.e. <b>₹300, ₹200, ₹200</b>.</p>\n<div class=\"tip\"><b>Exam habit:</b> name every row operation (R2 → R2 − 2R1) and substitute the answer back into one original equation to verify.</div>\n"
},
{
"id": "la-lu",
"unit": "u1",
"lec": "L7–8",
"title": "LU decomposition",
"sum": "A = LU with L unit lower triangular (holding the multipliers) and U the echelon form; solving Ly = B then Ux = y; reusing L and U for new B.",
"html": "\n<div class=\"tip\">From Lecture 7 (LU Decomposition) and Tutorial 6.</div>\n<h3>The idea</h3><p>Write a square matrix as <b>A = LU</b>:</p><ul><li><b>L</b>: lower triangular with <b>1s on the diagonal</b>; below the diagonal sit the multipliers used in elimination.</li><li><b>U</b>: upper triangular, the row echelon form reached by elimination.</li></ul>\n<p>Every multiplier m in “R<sub>i</sub> → R<sub>i</sub> − m·R<sub>j</sub>” goes into L at position (i, j).</p>\n<h3>2 × 2 example</h3><pre class=\"code\">A = [4 2; 8 7]\nR2 → R2 − 2R1 : (8, 7) − 2(4, 2) = (0, 3)     m = 2\nU = [4 2; 0 3]     L = [1 0; 2 1]\nCheck LU: row1 = (4, 2), row2 = (2·4, 2·2 + 3) = (8, 7) = A ✓</pre>\n<h3>3 × 3 example</h3><pre class=\"code\">A = [1 1 1; 2 1 3; 1 2 1]\nR2 → R2 − 2R1 : (0, −1, 1)     m21 = 2\nR3 → R3 − 1R1 : (0, 1, 0)      m31 = 1\nR3 → R3 − (−1)R2: (0, 0, 1)    m32 = −1\nU = [1 1 1; 0 −1 1; 0 0 1]    L = [1 0 0; 2 1 0; 1 −1 1]</pre>\n<h3>Solving AX = B with LU</h3><ol><li><b>Forward substitution:</b> solve Ly = B from the top down.</li><li><b>Back substitution:</b> solve Ux = y from the bottom up.</li></ol>\n<pre class=\"code\">A = [4 2; 8 7], B = (8, 22)\nLy = B: y1 = 8;  2(8) + y2 = 22 ⇒ y2 = 6\nUx = y: 3x2 = 6 ⇒ x2 = 2;  4x1 + 2(2) = 8 ⇒ x1 = 1</pre>\n<h3>Why bother?</h3><p>When the <b>same A</b> is used with many different B (a weekly order plan, a standing production recipe), you factor once and each new B needs only two quick triangular solves, with no new elimination.</p>\n<div class=\"tip\"><b>Watch out:</b> this simple method fails if a zero lands in a pivot position; then rows must be swapped first.</div>\n"
},
{
"id": "la-qr",
"unit": "u1",
"lec": "L9, L11",
"title": "Orthogonal matrices and QR decomposition",
"sum": "QᵀQ = I, Gram–Schmidt for two columns, A = QR, solving RX = QᵀB, and where QR is used.",
"html": "\n<div class=\"tip\">From Lecture 9 (QR Decomposition) and Tutorial 7.</div>\n<h3>Orthogonal matrix</h3><p>A square Q is <b>orthogonal</b> if <b>QᵀQ = I</b>: its columns are <b>unit vectors</b> that are <b>mutually perpendicular</b>. Both conditions are needed. Then <b>Q⁻¹ = Qᵀ</b>, and |Q| = ±1.</p>\n<p>Columns (1, 1) and (1, −1) are perpendicular but each has length √2, so that matrix is <b>not</b> orthogonal. Dividing by √2 fixes it. Rotation [0.6 −0.8; 0.8 0.6] is orthogonal: it turns shapes without stretching them.</p>\n<h3>QR decomposition</h3><p><b>A = QR</b>: Q orthogonal (orthonormal columns built from A's columns), R upper triangular.</p>\n<h3>Gram–Schmidt for two columns a<sub>1</sub>, a<sub>2</sub></h3>\n<ol><li>e<sub>1</sub> = a<sub>1</sub> / ‖a<sub>1</sub>‖</li><li>u<sub>2</sub> = a<sub>2</sub> − (a<sub>2</sub>·e<sub>1</sub>)e<sub>1</sub>, then e<sub>2</sub> = u<sub>2</sub> / ‖u<sub>2</sub>‖</li><li>R = [‖a<sub>1</sub>‖ &nbsp; a<sub>2</sub>·e<sub>1</sub>; 0 &nbsp; ‖u<sub>2</sub>‖]</li></ol>\n<pre class=\"code\">a1 = (3, 4), a2 = (1, 7)\n‖a1‖ = 5, e1 = (0.6, 0.8)\na2·e1 = 0.6 + 5.6 = 6.2\nu2 = (1, 7) − 6.2(0.6, 0.8) = (−2.72, 2.04), ‖u2‖ = 3.4, e2 = (−0.8, 0.6)\nQ = [0.6 −0.8; 0.8 0.6]     R = [5 6.2; 0 3.4]</pre>\n<h3>Solving AX = B with QR</h3><p>QRX = B ⇒ <b>RX = QᵀB</b> (since Qᵀ = Q⁻¹), then back-substitute.</p>\n<pre class=\"code\">A with columns (8, 6), (1, 7): Q = [0.8 −0.6; 0.6 0.8], R = [10 5; 0 5]\nB = (17, 19): QᵀB = (0.8·17 + 0.6·19, −0.6·17 + 0.8·19) = (25, 5)\n5x2 = 5 ⇒ x2 = 1;  10x1 + 5 = 25 ⇒ x1 = 2</pre>\n<h3>Where QR is used</h3><ul><li><b>Least-squares regression</b> (best-fit line through data)</li><li>Numerically stable solving of large systems</li><li>Computer graphics (rotations and reflections)</li><li>The <b>QR algorithm</b> for eigenvalues, and inside PCA</li></ul>\n"
},
{
"id": "la-review",
"unit": "u1",
"lec": "L10",
"title": "Unit I review: choosing the right tool",
"sum": "Which method to use for invertibility, solving once, solving many times, consistency and orthogonality, with integrated business problems.",
"html": "\n<div class=\"tip\">From Lecture 10 (Unit I Review).</div>\n<table><tr><th>The question asks…</th><th>Use</th></tr>\n<tr><td>Is A invertible?</td><td>det(A): ≠ 0 invertible, = 0 singular</td></tr>\n<tr><td>Find A⁻¹ of a small matrix</td><td>Gauss–Jordan on [A | I] (or the 2 × 2 formula)</td></tr>\n<tr><td>How many solutions does AX = B have?</td><td>Compare rank(A), rank[A | B] and n</td></tr>\n<tr><td>Solve AX = B once</td><td>Gaussian elimination + back-substitution</td></tr>\n<tr><td>Solve AX = B for many B, same A</td><td>LU once, then Ly = B and Ux = y each time</td></tr>\n<tr><td>Orthogonal directions, least squares, (later) eigenvalues</td><td>QR</td></tr>\n<tr><td>Does a transformation keep shape?</td><td>Check QᵀQ = I</td></tr>\n<tr><td>Are rows independent?</td><td>Rank</td></tr></table>\n<h3>Integrated example</h3><pre class=\"code\">A café's recipes: 5x + 2y = 29 (sugar),  3x + 4y = 23 (butter)\n|A| = 5·4 − 2·3 = 14 ≠ 0  ⇒ unique solution\n2 × first − second: 7x = 35 ⇒ x = 5;  25 + 2y = 29 ⇒ y = 2</pre>\n<pre class=\"code\">Rank and dependence: rows (1,2,3), (2,4,6), (0,1,1)\nRow 2 = 2 × Row 1, rows 1 and 3 not proportional ⇒ rank = 2 &lt; 3 rows ⇒ dependent</pre>\n<div class=\"tip\">Every Unit I method is the same handful of row operations used in a different way. If you can row-reduce accurately, you can do all of them.</div>\n"
},
{
"id": "la-eig",
"unit": "u2",
"lec": "L12",
"title": "Eigenvalues and eigenvectors",
"sum": "Av = λv, the characteristic equation det(A − λI) = 0, finding eigenvectors, trace and determinant checks, triangular matrices.",
"html": "\n<div class=\"tip\">From Lecture 12 (Eigenvalues and Eigenvectors) and Tutorial 8.</div>\n<h3>Definition</h3><p>A non-zero vector v is an <b>eigenvector</b> of a square matrix A if <b>Av = λv</b> for some number λ, the <b>eigenvalue</b>. A only stretches or flips v; its direction stays on the same line.</p>\n<h3>Finding eigenvalues: characteristic equation</h3><p><b>det(A − λI) = 0</b>. For a 2 × 2 matrix this is <b>λ² − (trace A)λ + det A = 0</b>.</p>\n<pre class=\"code\">A = [4 1; 2 3]:  trace = 7, det = 12 − 2 = 10\nλ² − 7λ + 10 = 0 ⇒ (λ − 5)(λ − 2) = 0 ⇒ λ = 5, 2</pre>\n<h3>Finding eigenvectors</h3><p>For each λ, solve <b>(A − λI)v = 0</b> and pick any non-zero solution.</p>\n<pre class=\"code\">λ = 5: (4 − 5)x + y = 0 ⇒ y = x ⇒ v = (1, 1)\nλ = 2: (4 − 2)x + y = 0 ⇒ y = −2x ⇒ v = (1, −2)\nCheck: A(1,1) = (5, 5) = 5(1, 1) ✓</pre>\n<h3>Quick checks</h3><ul><li><b>Sum of eigenvalues = trace(A)</b> (sum of diagonal).</li><li><b>Product of eigenvalues = det(A)</b>.</li><li>Triangular or diagonal matrix: eigenvalues = <b>diagonal entries</b>.</li><li>A zero eigenvalue ⟺ det(A) = 0 ⟺ A is singular.</li><li>Any non-zero multiple of an eigenvector is also an eigenvector.</li></ul>\n<h3>In context</h3><p>In an advertising-budget or market-share model, the eigenvector of the largest eigenvalue is the mix that the system settles into; the eigenvalue tells how fast that mix grows each cycle.</p>\n"
},
{
"id": "la-diag",
"unit": "u2",
"lec": "L13–14",
"title": "Diagonalization and matrix powers",
"sum": "A = PDP⁻¹ with eigenvectors in P and eigenvalues in D, the distinct-eigenvalue condition, verification, and Aⁿ = PDⁿP⁻¹.",
"html": "\n<div class=\"tip\">From Lecture 13 (Diagonalization) and Tutorial 8.</div>\n<h3>The factorisation</h3><p>If an n × n matrix has n linearly independent eigenvectors, then <b>A = PDP⁻¹</b>:</p><ul><li><b>P</b>: eigenvectors as <b>columns</b>.</li><li><b>D</b>: the matching eigenvalues on the diagonal, <b>in the same order</b>.</li></ul>\n<p>For a 2 × 2 matrix, <b>two distinct eigenvalues guarantee</b> it is diagonalizable.</p>\n<pre class=\"code\">A = [4 1; 2 3]: λ = 5 → (1, 1), λ = 2 → (1, −2)\nP = [1 1; 1 −2]     D = [5 0; 0 2]\n|P| = −3, P⁻¹ = (1/−3)[−2 −1; −1 1] = [2/3 1/3; 1/3 −1/3]\nPDP⁻¹ = A ✓</pre>\n<h3>Powers the fast way</h3><p><b>Aⁿ = PDⁿP⁻¹</b>, and Dⁿ just raises each diagonal entry to the power n.</p>\n<pre class=\"code\">A = [3 2; 1 2]: λ = 4 → (2, 1), λ = 1 → (1, −1)\nP = [2 1; 1 −1], D = [4 0; 0 1], P⁻¹ = [1/3 1/3; 1/3 −2/3]\nA² = P D² P⁻¹ with D² = [16 0; 0 1]  ⇒  A² = [11 10; 5 6]\n(Direct check: A·A = [11 10; 5 6] ✓)</pre>\n<h3>Why it matters</h3><p>A transition matrix applied for many periods (customers switching brands, sectors feeding each other) needs Aⁿ. Diagonalization needs one P and one P⁻¹, then only powers of numbers: far less work than multiplying A by itself n − 1 times.</p>\n"
},
{
"id": "la-spec",
"unit": "u2",
"lec": "L15",
"title": "The Spectral Theorem",
"sum": "Real symmetric matrices have real eigenvalues and orthogonal eigenvectors, so A = QDQᵀ with no inverse needed.",
"html": "\n<div class=\"tip\">From Lecture 15 (Spectral Theorem).</div>\n<h3>Statement</h3><p>If A is a <b>real symmetric</b> matrix (A = Aᵀ), then:</p><ol><li>All its eigenvalues are <b>real</b>.</li><li>Eigenvectors for different eigenvalues are <b>orthogonal</b> (dot product 0).</li><li>A can be <b>orthogonally diagonalized</b>: <b>A = QDQᵀ</b>, where Q's columns are the <b>normalized</b> (unit-length) eigenvectors.</li></ol>\n<h3>Worked example</h3><pre class=\"code\">A = [9 12; 12 16] (symmetric):  trace = 25, det = 144 − 144 = 0\nλ² − 25λ = 0 ⇒ λ = 25, 0\nλ = 25: −16x + 12y = 0 ⇒ v = (3, 4) → unit (0.6, 0.8)\nλ = 0 :   9x + 12y = 0 ⇒ v = (4, −3) → unit (0.8, −0.6)\nDot product: 0.6·0.8 + 0.8·(−0.6) = 0 ✓ orthogonal\nQ = [0.6 0.8; 0.8 −0.6],  D = [25 0; 0 0],  A = QDQᵀ</pre>\n<h3>Why orthogonal diagonalization is better</h3><ul><li><b>No inverse needed:</b> Q⁻¹ = Qᵀ.</li><li>Numerically the most stable way to diagonalize.</li><li>It is the mathematics behind <b>PCA</b>: a covariance matrix is symmetric.</li></ul>\n<p>A <b>non-symmetric</b> matrix has no such guarantee: its eigenvectors need not be perpendicular, and its eigenvalues can be complex.</p>\n<div class=\"tip\"><b>Exam habit:</b> normalize each eigenvector (divide by its length) before placing it in Q, and show the dot product = 0.</div>\n"
},
{
"id": "la-pca",
"unit": "u2",
"lec": "L16",
"title": "Applications: PCA and PageRank",
"sum": "Principal components as eigenvectors of the covariance matrix, variance explained by eigenvalues, and PageRank as the eigenvector for λ = 1 of a column-stochastic link matrix.",
"html": "\n<div class=\"tip\">From Lecture 16 (PCA and PageRank Preview).</div>\n<h3>Principal Component Analysis (PCA)</h3><ul><li>The spread of data is captured by its <b>covariance matrix</b>, which is always <b>symmetric</b>.</li><li>Its <b>eigenvectors are the principal components</b>: the directions along which the data varies.</li><li>Each <b>eigenvalue</b> measures the variance along its component. Share explained = λ<sub>i</sub> / (sum of all λ).</li><li><b>Dimensionality reduction:</b> keep only the top few components and lose little information.</li></ul>\n<pre class=\"code\">Covariance A = [34 12; 12 41]: trace = 75, det = 1394 − 144 = 1250\nλ² − 75λ + 1250 = 0 ⇒ λ = 50, 25\nPC1 share = 50 / 75 ≈ 66.7%\nλ = 50: −16x + 12y = 0 ⇒ (3, 4) → unit (0.6, 0.8)</pre>\n<h3>PageRank</h3><ul><li>Build a <b>link matrix M</b>: column j shows how page j splits its “vote” equally among the pages it links to. Each column sums to 1 (<b>column-stochastic</b>).</li><li>PageRank scores = the <b>eigenvector of M for eigenvalue 1</b>, scaled so the scores add to 1.</li><li>For millions of pages it is found by the <b>power method</b>: multiply a starting vector by M again and again.</li></ul>\n<pre class=\"code\">Two pages linking to each other: M = [0 1; 1 0]\nM(1, 1) = (1, 1) = 1·(1, 1) ⇒ scores (0.5, 0.5)</pre>\n<h3>Unit II in one line each</h3><ul><li>L12: eigenvalues and eigenvectors.</li><li>L13–14: diagonalize to get powers fast.</li><li>L15: symmetric ⇒ orthogonal eigenvectors.</li><li>L16: PCA and PageRank use the dominant eigenvector.</li></ul>\n<p>Both rely on the eigen<b>vector</b>: the eigenvalue is only a number, while the vector gives the direction (principal component) or the ranking itself.</p>\n"
}
],
"guide": "<h3>How to write a maths answer that scores full marks</h3>\n<ol><li><b>State what you will use.</b> “Using the Gauss–Jordan method…”, “By cofactor expansion along row 1…”.</li>\n<li><b>Write the matrix or system first</b>, with its order if relevant (A is 2 × 3).</li>\n<li><b>Name every row operation</b>: R2 → R2 − 2R1. Markers award step marks even if the final number slips.</li>\n<li><b>Box the final answer</b> and write it in words where helpful (x = 3, y = 2 ⇒ ₹300 and ₹200).</li>\n<li><b>Verify</b>: AA⁻¹ = I, LU = A, Av = λv, trace and determinant checks. A one-line check is usually worth a mark.</li>\n<li><b>Interpret</b> in the business context when the question has one.</li></ol>\n<h3>Typical university question verbs</h3>\n<table><tr><th>Verb</th><th>Bloom level</th><th>What to write</th></tr>\n<tr><td>Define, state</td><td>BT1 Remember</td><td>Exact definition or result + one example</td></tr>\n<tr><td>Explain, describe</td><td>BT2 Understand</td><td>Meaning, steps and why it works</td></tr>\n<tr><td>Find, solve, evaluate, verify</td><td>BT3 Apply</td><td>Full working, named steps, check</td></tr>\n<tr><td>Analyse, decide, compare</td><td>BT4 Analyse</td><td>Use rank / eigenvalues to reach and justify a conclusion</td></tr>\n<tr><td>Recommend, justify</td><td>BT5 Evaluate</td><td>Decision + reasons + limitation</td></tr></table>\n<h3>Matrix notation on this site</h3><p>[a b; c d] means a matrix whose first row is (a, b) and second row is (c, d), the same as the CULMS slides' “rows (a, b) and (c, d)”.</p>",
"bank": [
[
"la-ops",
"Find the entry in row 2, column 2 of AB.\nA = | −2   2 |\n    |  5   5 |\nB = | −2   0 |\n    |  5   3 |",
"15",
[
"25",
"17",
"16"
],
"(AB) row 2, column 2 = row 2 of A · column 2 of B = 5·0 + 5·3 = 15."
],
[
"la-ops",
"Find the entry in row 2, column 2 of AB.\nA = |  0  −3 |\n    | −2  −2 |\nB = |  1  −2 |\n    |  4  −3 |",
"10",
[
"−6",
"12",
"6"
],
"(AB) row 2, column 2 = row 2 of A · column 2 of B = −2·−2 + −2·−3 = 10."
],
[
"la-ops",
"Find the entry in row 2, column 1 of AB.\nA = | 0  3 |\n    | 1  2 |\nB = |  2   3 |\n    |  5  −2 |",
"12",
[
"−2",
"5",
"14"
],
"(AB) row 2, column 1 = row 2 of A · column 1 of B = 1·2 + 2·5 = 12."
],
[
"la-ops",
"Find the entry in row 2, column 2 of AB.\nA = | 5  5 |\n    | 1  1 |\nB = |  4  −1 |\n    |  1  −3 |",
"−4",
[
"2",
"−8",
"−3"
],
"(AB) row 2, column 2 = row 2 of A · column 2 of B = 1·−1 + 1·−3 = −4."
],
[
"la-ops",
"Find the entry in row 2, column 2 of AB.\nA = |  4   3 |\n    | −2   3 |\nB = |  5   4 |\n    | −2   3 |",
"1",
[
"3",
"21",
"9"
],
"(AB) row 2, column 2 = row 2 of A · column 2 of B = −2·4 + 3·3 = 1."
],
[
"la-ops",
"A is 2 × 3 and B is 3 × 4. What is the order of AB?",
"2 × 4",
[
"3 × 3",
"4 × 2",
"2 × 3"
],
"Inner orders match (3 = 3), so AB exists; the outer numbers give the order 2 × 4."
],
[
"la-ops",
"A is 3 × 2 and B is 2 × 2. What is the order of AB?",
"3 × 2",
[
"2 × 2",
"2 × 3",
"AB is not defined"
],
"Inner orders match (2 = 2), so AB exists; the outer numbers give the order 3 × 2."
],
[
"la-ops",
"A is 1 × 3 and B is 3 × 1. What is the order of AB?",
"1 × 1",
[
"3 × 3",
"1 × 3",
"3 × 1"
],
"Inner orders match (3 = 3), so AB exists; the outer numbers give the order 1 × 1."
],
[
"la-ops",
"A is 4 × 2 and B is 2 × 3. What is the order of AB?",
"4 × 3",
[
"2 × 2",
"3 × 4",
"4 × 2"
],
"Inner orders match (2 = 2), so AB exists; the outer numbers give the order 4 × 3."
],
[
"la-ops",
"A is 2 × 3 and B is 2 × 3. Which product is defined?",
"ABᵀ (2 × 2)",
[
"AB (2 × 3)",
"AB (3 × 3)",
"Neither AB nor ABᵀ"
],
"AB needs columns of A (3) = rows of B (2), which fails. Bᵀ is 3 × 2, so ABᵀ is (2 × 3)(3 × 2) = 2 × 2."
],
[
"la-ops",
"Find 4A − B.\nA = | 4  0 |\n    | 2  5 |\nB = |  3   4 |\n    |  4  −4 |",
"[13 −4; 4 24]",
[
"[19 4; 12 16]",
"[−8 −16; −14 21]",
"[4 −16; −8 36]"
],
"Multiply every entry of A by 4, then subtract B entry by entry: [13 −4; 4 24]."
],
[
"la-ops",
"Find 3A − B.\nA = | −1  −2 |\n    | −4   4 |\nB = |  6  −3 |\n    |  5   2 |",
"[−9 −3; −17 10]",
[
"[3 −9; −7 14]",
"[−19 7; −19 −2]",
"[−21 3; −27 6]"
],
"Multiply every entry of A by 3, then subtract B entry by entry: [−9 −3; −17 10]."
],
[
"la-ops",
"Find 4A − B.\nA = | −2   3 |\n    | −1  −3 |\nB = | 6  3 |\n    | 6  3 |",
"[−14 9; −10 −15]",
[
"[−2 15; 2 −9]",
"[−26 −9; −25 −15]",
"[−32 0; −28 −24]"
],
"Multiply every entry of A by 4, then subtract B entry by entry: [−14 9; −10 −15]."
],
[
"la-ops",
"For square matrices A and B of the same order, which statement is always true?",
"(AB)C = A(BC)",
[
"AB = BA",
"If AB = O then A = O or B = O",
"(A + B)² = A² + 2AB + B²"
],
"Matrix multiplication is associative but not commutative, so (A + B)² = A² + AB + BA + B², and AB = O is possible with non-zero A and B."
],
[
"la-ops",
"A matrix in which every off-diagonal entry is 0 and all diagonal entries are equal is called:",
"A scalar matrix",
[
"A zero matrix",
"An upper triangular matrix only",
"A skew−symmetric matrix"
],
"Diagonal with equal diagonal entries = scalar matrix, e.g. 5I."
],
[
"la-ops",
"A shop sells quantities Q = [20 15 10] at prices P = [50; 80; 120] (a column). What does the product QP give?",
"₹3,400, the total revenue",
[
"A 3 × 3 revenue table",
"₹250, the average price",
"QP is not defined"
],
"(1 × 3)(3 × 1) = 1 × 1: 20·50 + 15·80 + 10·120 = 1000 + 1200 + 1200 = 3400."
],
[
"la-ops",
"Which matrix is upper triangular?\n| 2  5  1 |\n| 0  3  4 |\n| 0  0  6 |",
"This one: all entries below the diagonal are 0",
[
"None, because the diagonal is not all 1s",
"It is lower triangular",
"It is a diagonal matrix"
],
"Upper triangular means zeros below the main diagonal; the diagonal can hold any values."
],
[
"la-ops",
"If A is 3 × 2, how many entries does A have and what is a₃₂?",
"6 entries; a₃₂ is in row 3, column 2",
[
"5 entries; a₃₂ is in row 2, column 3",
"6 entries; a₃₂ is in row 2, column 3",
"9 entries; a₃₂ is in row 3, column 2"
],
"Order m × n has mn entries; aᵢⱼ is row i, column j."
],
[
"la-ops",
"AI equals which of these, for a square matrix A and identity I of the same order?",
"A",
[
"I",
"O",
"Aᵀ"
],
"The identity acts like the number 1: AI = IA = A."
],
[
"la-trans",
"Find A⁻¹.\nA = | 4  5 |\n    | 3  4 |",
"[4 −5; −3 4]",
[
"[−4 5; 3 −4]",
"[4 5; 3 4]",
"[4 3; 5 4]"
],
"|A| = 4·4 − 5·3 = 1. A⁻¹ = (1/1)[4 −5; −3 4] = [4 −5; −3 4]. Check AA⁻¹ = I."
],
[
"la-trans",
"Find A⁻¹.\nA = | 3  4 |\n    | 2  3 |",
"[3 −4; −2 3]",
[
"[−3 4; 2 −3]",
"[3 4; 2 3]",
"[3 2; 4 3]"
],
"|A| = 3·3 − 4·2 = 1. A⁻¹ = (1/1)[3 −4; −2 3] = [3 −4; −2 3]. Check AA⁻¹ = I."
],
[
"la-trans",
"Find A⁻¹.\nA = | 2  1 |\n    | 3  2 |",
"[2 −1; −3 2]",
[
"[−2 1; 3 −2]",
"[2 1; 3 2]",
"[2 3; 1 2]"
],
"|A| = 2·2 − 1·3 = 1. A⁻¹ = (1/1)[2 −1; −3 2] = [2 −1; −3 2]. Check AA⁻¹ = I."
],
[
"la-trans",
"Find A⁻¹.\nA = | 2  1 |\n    | 5  3 |",
"[3 −1; −5 2]",
[
"[−3 1; 5 −2]",
"[3 1; 5 2]",
"[2 5; 1 3]"
],
"|A| = 2·3 − 1·5 = 1. A⁻¹ = (1/1)[3 −1; −5 2] = [3 −1; −5 2]. Check AA⁻¹ = I."
],
[
"la-trans",
"Find Aᵀ.\nA = |  1   6  −2 |\n    |  1   2  −1 |",
"[1 1; 6 2; −2 −1]",
[
"[1 2 −1; 1 6 −2]",
"[−2 −1; 6 2; 1 1]",
"[1 1; 2 6; −1 −2]"
],
"Row i of A becomes column i of Aᵀ, so the 2 × 3 matrix becomes 3 × 2."
],
[
"la-trans",
"Find Aᵀ.\nA = |  1   1  −2 |\n    | −3   3   1 |",
"[1 −3; 1 3; −2 1]",
[
"[−3 3 1; 1 1 −2]",
"[−2 1; 1 3; 1 −3]",
"[−3 1; 3 1; 1 −2]"
],
"Row i of A becomes column i of Aᵀ, so the 2 × 3 matrix becomes 3 × 2."
],
[
"la-trans",
"Find Aᵀ.\nA = |  3  −3  −3 |\n    | −2   0  −3 |",
"[3 −2; −3 0; −3 −3]",
[
"[−2 0 −3; 3 −3 −3]",
"[−3 −3; −3 0; 3 −2]",
"[−2 3; 0 −3; −3 −3]"
],
"Row i of A becomes column i of Aᵀ, so the 2 × 3 matrix becomes 3 × 2."
],
[
"la-trans",
"Is A = [3 7; 7 3] symmetric, skew-symmetric or neither?",
"Symmetric",
[
"Skew−symmetric",
"Neither",
"Both"
],
"Aᵀ = A since the mirror entries (7 and 7) match. The diagonal can be anything for a symmetric matrix."
],
[
"la-trans",
"Is A = [0 4; −4 0] symmetric, skew-symmetric or neither?",
"Skew−symmetric",
[
"Symmetric",
"Neither",
"Orthogonal"
],
"Aᵀ = [0 −4; 4 0] = −A, and the diagonal is 0 as required."
],
[
"la-trans",
"(AB)ᵀ is equal to:",
"BᵀAᵀ",
[
"AᵀBᵀ",
"BA",
"(BA)ᵀ"
],
"Transposing a product reverses the order (Lecture 3, verified in Tutorial 5)."
],
[
"la-trans",
"(AB)⁻¹ is equal to:",
"B⁻¹A⁻¹",
[
"A⁻¹B⁻¹",
"(BA)⁻¹ only when A = B",
"Aᵀ Bᵀ"
],
"Inverting a product reverses the order: (AB)(B⁻¹A⁻¹) = A(BB⁻¹)A⁻¹ = I."
],
[
"la-trans",
"In the Gauss–Jordan method you row-reduce [A | I]. What do you have when the left block becomes I?",
"[I | A⁻¹]",
[
"[A⁻¹ | I]",
"[I | Aᵀ]",
"[I | det A]"
],
"The same operations that turn A into I turn I into A⁻¹."
],
[
"la-trans",
"While row-reducing [A | I], a full row of zeros appears in the left block. This means:",
"A is singular and has no inverse",
[
"A⁻¹ = O",
"A is the identity",
"You made an error; every square matrix has an inverse"
],
"A zero row means rank < n and det(A) = 0, so no inverse exists."
],
[
"la-trans",
"In a skew-symmetric matrix, the diagonal entries must be:",
"0",
[
"1",
"Equal to each other but any value",
"Negative"
],
"aᵢᵢ = −aᵢᵢ forces aᵢᵢ = 0."
],
[
"la-trans",
"For which value of x is A = [2 x; 5 3] symmetric?",
"5",
[
"2",
"3",
"−5"
],
"Symmetric needs a₁₂ = a₂₁, so x = 5."
],
[
"la-trans",
"Every square matrix A can be written as:",
"½(A + Aᵀ) + ½(A − Aᵀ): symmetric + skew−symmetric",
[
"AᵀA only",
"A product of two symmetric matrices only",
"The sum of two inverses"
],
"A + Aᵀ is symmetric and A − Aᵀ is skew-symmetric, and halves of them add back to A."
],
[
"la-det",
"Evaluate |A|.\nA = |  0  −3 |\n    | −3   6 |",
"−9",
[
"9",
"18",
"−8"
],
"|A| = a₁₁a₂₂ − a₁₂a₂₁ = (0)(6) − (−3)(−3) = −9."
],
[
"la-det",
"Evaluate |A|.\nA = | 4  5 |\n    | 1  1 |",
"−1",
[
"9",
"1",
"0"
],
"|A| = a₁₁a₂₂ − a₁₂a₂₁ = (4)(1) − (5)(1) = −1."
],
[
"la-det",
"Evaluate |A|.\nA = | 3  5 |\n    | 6  6 |",
"−12",
[
"48",
"12",
"−11"
],
"|A| = a₁₁a₂₂ − a₁₂a₂₁ = (3)(6) − (5)(6) = −12."
],
[
"la-det",
"Evaluate |A|.\nA = |  7   5 |\n    | −4   2 |",
"34",
[
"−6",
"−34",
"−38"
],
"|A| = a₁₁a₂₂ − a₁₂a₂₁ = (7)(2) − (5)(−4) = 34."
],
[
"la-det",
"Evaluate |A| by cofactor expansion.\n    |  0   2  −1 |\nA = |  2   1   0 |\n    |  3  −2   3 |",
"−5",
[
"19",
"5",
"0"
],
"Along row 1: 0(3) − (2)(6) + (−1)(−7) = −5. Remember the + − + signs."
],
[
"la-det",
"Evaluate |A| by cofactor expansion.\n    |  3   0   1 |\nA = |  0   4   0 |\n    | −2   3   3 |",
"44",
[
"−44",
"36",
"45"
],
"Along row 1: 3(12) − (0)(0) + (1)(8) = 44. Remember the + − + signs."
],
[
"la-det",
"Evaluate |A| by cofactor expansion.\n    |  0   3   0 |\nA = |  0   0   4 |\n    |  4  −2   0 |",
"48",
[
"−48",
"0",
"49"
],
"Along row 1: 0(8) − (3)(−16) + (0)(0) = 48. Remember the + − + signs."
],
[
"la-det",
"Evaluate |A| by cofactor expansion.\n    |  2  −2   0 |\nA = |  0  −1   2 |\n    | −2   3  −2 |",
"0",
[
"−16",
"7",
"−8"
],
"Along row 1: 2(−4) − (−2)(4) + (0)(−2) = 0. Remember the + − + signs."
],
[
"la-det",
"A is 3 × 3 with |A| = 5. Find |2A|.",
"40",
[
"10",
"20",
"7"
],
"Each of the 3 rows is multiplied by 2, so |2A| = 2^3·|A| = 8·5 = 40."
],
[
"la-det",
"A is 2 × 2 with |A| = 4. Find |3A|.",
"36",
[
"12",
"108",
"7"
],
"Each of the 2 rows is multiplied by 3, so |3A| = 3^2·|A| = 9·4 = 36."
],
[
"la-det",
"A is 3 × 3 with |A| = -2. Find |3A|.",
"−54",
[
"−6",
"−18",
"1"
],
"Each of the 3 rows is multiplied by 3, so |3A| = 3^3·|A| = 27·-2 = -54."
],
[
"la-det",
"For what values of x is M = [x 4; 1 x] singular?",
"x = ±2",
[
"x = 4",
"x = 0 only",
"x = ±4"
],
"|M| = x² − 4 = 0 ⇒ x² = 4."
],
[
"la-det",
"For what values of x is M = [x 6; 1 x] singular?",
"x = ±√6",
[
"x = 6",
"x = 0 only",
"x = ±6"
],
"|M| = x² − 6 = 0 ⇒ x² = 6."
],
[
"la-det",
"Find the rank of [1 3; 2 6].",
"1",
[
"2",
"0",
"3"
],
"R2 → R2 − 2R1 gives (0, 0): one non-zero row, so rank = 1 (row 2 is twice row 1)."
],
[
"la-det",
"Find the rank of the matrix with rows (1, 0, 2), (2, 1, 3), (3, 1, 5).",
"2",
[
"3",
"1",
"0"
],
"R2 − 2R1 = (0, 1, −1), R3 − 3R1 = (0, 1, −1), then R3 − R2 = (0, 0, 0). Two non-zero rows."
],
[
"la-det",
"Find the rank of the matrix with rows (1, 2, 3), (2, 4, 6), (0, 1, 1).",
"2",
[
"1",
"3",
"0"
],
"Row 2 = 2 × Row 1, and rows 1 and 3 are not proportional, so rank = 2."
],
[
"la-det",
"A 3 × 3 matrix has |A| = 0. Which is definitely true?",
"rank(A) < 3 and A has no inverse",
[
"rank(A) = 0",
"A is the zero matrix",
"A is symmetric"
],
"|A| = 0 ⟺ singular ⟺ rows dependent ⟺ rank < n."
],
[
"la-det",
"Swapping two rows of a matrix changes its determinant by:",
"Changing its sign",
[
"Nothing",
"Making it zero",
"Doubling it"
],
"A row swap multiplies the determinant by −1."
],
[
"la-det",
"If |A| = 4 and |B| = −3 (same order), |AB| is:",
"−12",
[
"1",
"−7",
"12"
],
"|AB| = |A||B| = 4 × (−3)."
],
[
"la-det",
"The determinant of [2 7 1; 0 3 9; 0 0 5] is:",
"30",
[
"10",
"0",
"−30"
],
"Triangular: product of the diagonal 2 × 3 × 5 = 30."
],
[
"la-det",
"What is the largest possible rank of a 3 × 5 matrix?",
"3",
[
"5",
"15",
"8"
],
"rank ≤ min(m, n) = min(3, 5)."
],
[
"la-gauss",
"Solve by Gaussian elimination: 3x − 3y = 9 and 4x − y = 18.",
"x = 5, y = 2",
[
"x = 2, y = 5",
"x = 5, y = −2",
"x = −5, y = 2"
],
"Eliminate x from row 2, solve for y, then back substitute. Check in equation 1: 3(5) + (−3)(2) = 9 ✓"
],
[
"la-gauss",
"Solve by Gaussian elimination: 4x + 3y = 17 and 2x + 3y = 13.",
"x = 2, y = 3",
[
"x = 3, y = 2",
"x = 2, y = −3",
"x = −2, y = 3"
],
"Eliminate x from row 2, solve for y, then back substitute. Check in equation 1: 4(2) + (3)(3) = 17 ✓"
],
[
"la-gauss",
"Solve by Gaussian elimination: 2x − 3y = 3 and 4x + y = −1.",
"x = 0, y = −1",
[
"x = −1, y = 0",
"x = 0, y = 1",
"x = 2, y = −1"
],
"Eliminate x from row 2, solve for y, then back substitute. Check in equation 1: 2(0) + (−3)(−1) = 3 ✓"
],
[
"la-gauss",
"Solve by Gaussian elimination: x − 3y = −1 and 3x + 4y = −3.",
"x = −1, y = 0",
[
"x = 0, y = −1",
"x = −1, y = 1",
"x = 1, y = 0"
],
"Eliminate x from row 2, solve for y, then back substitute. Check in equation 1: 1(−1) + (−3)(0) = −1 ✓"
],
[
"la-gauss",
"Solve by Gaussian elimination: 3x − y = 8 and x − y = 2.",
"x = 3, y = 1",
[
"x = 1, y = 3",
"x = 3, y = −1",
"x = −3, y = 1"
],
"Eliminate x from row 2, solve for y, then back substitute. Check in equation 1: 3(3) + (−1)(1) = 8 ✓"
],
[
"la-gauss",
"Solve: x + y + z = 6, x − y + 2z = 5, 2x + y − z = 1.",
"x = 1, y = 2, z = 3",
[
"x = 3, y = 2, z = 1",
"x = 2, y = 1, z = 3",
"No solution"
],
"R2 − R1 = (0, −2, 1 | −1), R3 − 2R1 = (0, −1, −3 | −11), R3 − ½R2 = (0, 0, −3.5 | −10.5) ⇒ z = 3, y = 2, x = 1."
],
[
"la-gauss",
"x + y = 3 and 2x + 2y = 10. The system has:",
"No solution",
[
"A unique solution",
"Infinitely many solutions",
"Exactly two solutions"
],
"R2 − 2R1 gives 0 = 4, which is false, so the system is inconsistent."
],
[
"la-gauss",
"x + 2y = 4 and 2x + 4y = 8. The system has:",
"Infinitely many solutions",
[
"No solution",
"A unique solution",
"Only x = 0, y = 0"
],
"R2 − 2R1 gives 0 = 0: the equations are the same line."
],
[
"la-gauss",
"For what k does x + y = 3, 2x + 2y = k have infinitely many solutions?",
"k = 6",
[
"k = 3",
"k = 0",
"Any k except 6"
],
"R2 − 2R1 gives 0 = k − 6, which must read 0 = 0."
],
[
"la-gauss",
"If rank(A) = rank[A | B] = 2 for a system in 3 unknowns, the system has:",
"Infinitely many solutions",
[
"A unique solution",
"No solution",
"Exactly 3 solutions"
],
"Consistent (ranks equal) but rank < n = 3, so one free variable."
],
[
"la-gauss",
"If rank(A) = 2 but rank[A | B] = 3, the system is:",
"Inconsistent: no solution",
[
"Consistent with a unique solution",
"Consistent with infinitely many solutions",
"Homogeneous"
],
"Different ranks mean some row reduces to 0 = non-zero."
],
[
"la-gauss",
"A homogeneous system AX = 0 is always:",
"Consistent, because X = 0 is a solution",
[
"Inconsistent",
"Uniquely solvable",
"Without any solution if |A| = 0"
],
"The trivial solution always works; if rank(A) < n there are non-trivial solutions as well."
],
[
"la-gauss",
"In Gaussian elimination, the two stages are:",
"Forward elimination to echelon form, then back−substitution",
[
"Transpose, then invert",
"Back−substitution, then forward elimination",
"Find the determinant, then the rank"
],
"Lecture 6: reduce [A | B] to a staircase, then solve from the last equation upward."
],
[
"la-gauss",
"A shop sells boxes P, Q, R for ₹x, ₹y, ₹z hundred. x + y + z = 7, 2x + y + z = 10, x + 2y + z = 9. Price of P?",
"₹300",
[
"₹200",
"₹700",
"₹100"
],
"R2 − R1 gives x = 3 directly (since the y and z terms cancel), so P = ₹300. Then y = 2, z = 2."
],
[
"la-lu",
"For A = LU (L unit lower triangular), find U.\nA = |  5  −3 |\n    | 20  −7 |",
"[5 −3; 0 5]",
[
"[5 −3; 0 −7]",
"[1 0; 4 1]",
"[5 −3; 4 5]"
],
"R2 → R2 − 4R1 gives (0, 5), so U = [5 −3; 0 5] and L = [1 0; 4 1]."
],
[
"la-lu",
"For the same idea, A = [5 −3; 20 −7]. What is the entry l₂₁ of L?",
"4",
[
"5",
"3",
"6"
],
"The multiplier in R2 → R2 − 4R1 is 4, which goes into L at row 2, column 1."
],
[
"la-lu",
"For A = LU (L unit lower triangular), find U.\nA = |  3   2 |\n    | 12  13 |",
"[3 2; 0 5]",
[
"[3 2; 0 13]",
"[1 0; 4 1]",
"[3 2; 4 5]"
],
"R2 → R2 − 4R1 gives (0, 5), so U = [3 2; 0 5] and L = [1 0; 4 1]."
],
[
"la-lu",
"For the same idea, A = [3 2; 12 13]. What is the entry l₂₁ of L?",
"4",
[
"5",
"3",
"6"
],
"The multiplier in R2 → R2 − 4R1 is 4, which goes into L at row 2, column 1."
],
[
"la-lu",
"For A = LU (L unit lower triangular), find U.\nA = |   3   −3 |\n    |  12  −11 |",
"[3 −3; 0 1]",
[
"[3 −3; 0 −11]",
"[1 0; 4 1]",
"[3 −3; 4 1]"
],
"R2 → R2 − 4R1 gives (0, 1), so U = [3 −3; 0 1] and L = [1 0; 4 1]."
],
[
"la-lu",
"For the same idea, A = [3 −3; 12 −11]. What is the entry l₂₁ of L?",
"4",
[
"1",
"3",
"5"
],
"The multiplier in R2 → R2 − 4R1 is 4, which goes into L at row 2, column 1."
],
[
"la-lu",
"For A = LU (L unit lower triangular), find U.\nA = |  2   4 |\n    |  4  10 |",
"[2 4; 0 2]",
[
"[2 4; 0 10]",
"[1 0; 2 1]",
"[2 4; 2 2]"
],
"R2 → R2 − 2R1 gives (0, 2), so U = [2 4; 0 2] and L = [1 0; 2 1]."
],
[
"la-lu",
"For the same idea, A = [2 4; 4 10]. What is the entry l₂₁ of L?",
"2",
[
"3",
"1",
"4"
],
"The multiplier in R2 → R2 − 2R1 is 2, which goes into L at row 2, column 1."
],
[
"la-lu",
"For A = LU (L unit lower triangular), find U.\nA = |  5  −1 |\n    | 20   0 |",
"[5 −1; 0 4]",
[
"[5 −1; 0 0]",
"[1 0; 4 1]",
"[5 −1; 4 4]"
],
"R2 → R2 − 4R1 gives (0, 4), so U = [5 −1; 0 4] and L = [1 0; 4 1]."
],
[
"la-lu",
"For the same idea, A = [5 −1; 20 0]. What is the entry l₂₁ of L?",
"4",
[
"5",
"3",
"6"
],
"The multiplier in R2 → R2 − 4R1 is 4, which goes into L at row 2, column 1."
],
[
"la-lu",
"In A = LU, the diagonal entries of L are:",
"All 1",
[
"The pivots of A",
"All 0",
"The eigenvalues of A"
],
"L is unit lower triangular: 1s on the diagonal, multipliers below."
],
[
"la-lu",
"U in A = LU is:",
"The row echelon form (upper triangular) reached by elimination",
[
"The transpose of L",
"The inverse of L",
"Always the identity"
],
"U is exactly what forward elimination produces."
],
[
"la-lu",
"To solve AX = B with A = LU you:",
"Solve Ly = B by forward substitution, then Ux = y by back substitution",
[
"Invert L and U and multiply",
"Solve Ux = B, then Ly = x",
"Find det(L) and det(U)"
],
"Two triangular solves: top-down then bottom-up."
],
[
"la-lu",
"The main advantage of LU decomposition is:",
"Re−solving AX = B quickly for many different B with the same A",
[
"It works for every matrix without row swaps",
"It gives the eigenvalues directly",
"It makes A symmetric"
],
"Factor once, then each new B needs only two triangular solves."
],
[
"la-lu",
"With L = [1 0; 2 1], U = [4 2; 0 3] and B = (8, 22), the solution of AX = B is:",
"x₁ = 1, x₂ = 2",
[
"x₁ = 2, x₂ = 1",
"x₁ = 8, x₂ = 6",
"x₁ = 1, x₂ = 3"
],
"Ly = B: y = (8, 6). Ux = y: 3x₂ = 6 ⇒ x₂ = 2; 4x₁ + 4 = 8 ⇒ x₁ = 1."
],
[
"la-lu",
"Plain LU elimination (without row swaps) breaks down when:",
"A zero appears in a pivot position",
[
"A is symmetric",
"A has negative entries",
"B has zeros"
],
"You cannot divide by a zero pivot; rows must be swapped first."
],
[
"la-lu",
"For A = [1 1 1; 2 1 3; 1 2 1], the L found in Lecture 7 is:",
"[1 0 0; 2 1 0; 1 −1 1]",
[
"[1 0 0; 2 1 0; 1 1 1]",
"[1 1 1; 0 −1 1; 0 0 1]",
"[1 0 0; −2 1 0; −1 1 1]"
],
"Multipliers: m₂₁ = 2, m₃₁ = 1, m₃₂ = −1 (because R3 → R3 − (−1)R2)."
],
[
"la-qr",
"In the QR decomposition of A with columns a₁ = (3, 4) and a₂ = (6, 4), find R₁₁ and R₁₂.",
"R₁₁ = 5, R₁₂ = 6.8",
[
"R₁₁ = 7, R₁₂ = 6.8",
"R₁₁ = 5, R₁₂ = 34",
"R₁₁ = 25, R₁₂ = 6.8"
],
"R₁₁ = ‖a₁‖ = √(3² + 4²) = 5. e₁ = (0.6, 0.8), R₁₂ = a₂·e₁ = 6.8."
],
[
"la-qr",
"In the QR decomposition of A with columns a₁ = (6, 8) and a₂ = (9, 5), find R₁₁ and R₁₂.",
"R₁₁ = 10, R₁₂ = 9.4",
[
"R₁₁ = 14, R₁₂ = 9.4",
"R₁₁ = 10, R₁₂ = 94",
"R₁₁ = 100, R₁₂ = 9.4"
],
"R₁₁ = ‖a₁‖ = √(6² + 8²) = 10. e₁ = (0.6, 0.8), R₁₂ = a₂·e₁ = 9.4."
],
[
"la-qr",
"In the QR decomposition of A with columns a₁ = (8, 6) and a₂ = (6, 4), find R₁₁ and R₁₂.",
"R₁₁ = 10, R₁₂ = 7.2",
[
"R₁₁ = 14, R₁₂ = 7.2",
"R₁₁ = 10, R₁₂ = 72",
"R₁₁ = 100, R₁₂ = 7.2"
],
"R₁₁ = ‖a₁‖ = √(8² + 6²) = 10. e₁ = (0.8, 0.6), R₁₂ = a₂·e₁ = 7.2."
],
[
"la-qr",
"In the QR decomposition of A with columns a₁ = (4, 3) and a₂ = (6, 6), find R₁₁ and R₁₂.",
"R₁₁ = 5, R₁₂ = 8.4",
[
"R₁₁ = 7, R₁₂ = 8.4",
"R₁₁ = 5, R₁₂ = 42",
"R₁₁ = 25, R₁₂ = 8.4"
],
"R₁₁ = ‖a₁‖ = √(4² + 3²) = 5. e₁ = (0.8, 0.6), R₁₂ = a₂·e₁ = 8.4."
],
[
"la-qr",
"In the QR decomposition of A with columns a₁ = (9, 12) and a₂ = (8, 8), find R₁₁ and R₁₂.",
"R₁₁ = 15, R₁₂ = 11.2",
[
"R₁₁ = 21, R₁₂ = 11.2",
"R₁₁ = 15, R₁₂ = 168",
"R₁₁ = 225, R₁₂ = 11.2"
],
"R₁₁ = ‖a₁‖ = √(9² + 12²) = 15. e₁ = (0.6, 0.8), R₁₂ = a₂·e₁ = 11.2."
],
[
"la-qr",
"A matrix Q is orthogonal when:",
"QᵀQ = I",
[
"Q = Qᵀ",
"|Q| = 0",
"Q has only positive entries"
],
"Equivalently its columns are perpendicular unit vectors, so Q⁻¹ = Qᵀ."
],
[
"la-qr",
"Columns (1, 1) and (1, −1) are perpendicular. Is the matrix with these columns orthogonal?",
"No, the columns have length √2, not 1",
[
"Yes, perpendicular columns are enough",
"Yes, because its determinant is non−zero",
"No, because it is symmetric"
],
"Both conditions are needed: perpendicular AND unit length. QᵀQ = 2I ≠ I."
],
[
"la-qr",
"For an orthogonal matrix Q, Q⁻¹ equals:",
"Qᵀ",
[
"Q",
"−Q",
"1/|Q| · Q"
],
"QᵀQ = I means Qᵀ is the inverse: no Gauss–Jordan needed."
],
[
"la-qr",
"In A = QR, R is:",
"Upper triangular",
[
"Orthogonal",
"Lower triangular with 1s on the diagonal",
"Diagonal with eigenvalues"
],
"R records how A's columns are built from Q's orthonormal columns."
],
[
"la-qr",
"With A = QR, the system AX = B becomes:",
"RX = QᵀB",
[
"QX = RᵀB",
"X = RB",
"RX = QB"
],
"Multiply QRX = B by Qᵀ and use QᵀQ = I."
],
[
"la-qr",
"In Gram–Schmidt, u₂ = a₂ − (a₂·e₁)e₁. Why subtract (a₂·e₁)e₁?",
"To remove the part of a₂ along e₁, leaving a vector perpendicular to e₁",
[
"To make a₂ a unit vector",
"To find the determinant",
"To make the matrix symmetric"
],
"What is left is orthogonal to e₁; normalising it gives e₂."
],
[
"la-qr",
"Which is NOT a typical use of QR decomposition?",
"Finding a matrix's transpose",
[
"Least−squares regression",
"Numerically stable solving of systems",
"Eigenvalue algorithms"
],
"Transpose needs no decomposition; the other three are listed in Lecture 9."
],
[
"la-qr",
"Q = [0.6 −0.8; 0.8 0.6] is a rotation. Which is true?",
"QᵀQ = I, so it turns shapes without distorting them",
[
"It doubles every length",
"|Q| = 0",
"It is skew−symmetric"
],
"0.36 + 0.64 = 1 on the diagonal, −0.48 + 0.48 = 0 off it."
],
[
"la-qr",
"For a₁ = (8, 6), a₂ = (1, 7), Gram–Schmidt gives R =",
"[10 5; 0 5]",
[
"[10 0; 5 5]",
"[14 8; 0 5]",
"[10 5; 0 10]"
],
"‖a₁‖ = 10, e₁ = (0.8, 0.6), a₂·e₁ = 5, u₂ = (−3, 4), ‖u₂‖ = 5."
],
[
"la-review",
"You must solve AX = B for 12 different B vectors with the same A. The most efficient tool is:",
"LU decomposition once, then triangular solves",
[
"Gauss–Jordan inverse for each B",
"Cofactor expansion each time",
"Gram–Schmidt for each B"
],
"Lecture 10: same A, many B → LU."
],
[
"la-review",
"You only need to know whether a square matrix is invertible. Compute:",
"Its determinant",
[
"Its LU decomposition",
"Its transpose",
"Its trace"
],
"|A| ≠ 0 ⟺ invertible."
],
[
"la-review",
"You need to know whether AX = B has no, one or infinitely many solutions. Compare:",
"rank(A), rank[A | B] and the number of unknowns",
[
"|A| and |B|",
"trace(A) and n",
"A and Aᵀ"
],
"The rank test from Lecture 6."
],
[
"la-review",
"A café: 5x + 2y = 29 and 3x + 4y = 23. The solution is:",
"x = 5, y = 2",
[
"x = 2, y = 5",
"x = 3, y = 7",
"x = 4, y = 4.5"
],
"2 × first − second: 7x = 35, x = 5; then 2y = 4, y = 2."
],
[
"la-review",
"You must check whether a design transformation preserves shape (no stretching). Check whether:",
"QᵀQ = I",
[
"|Q| = 0",
"Q is upper triangular",
"Q = 2I"
],
"Orthogonal matrices preserve lengths and angles."
],
[
"la-review",
"For A = [1 2; 3 4], A⁻¹ is:",
"[−2 1; 1.5 −0.5]",
[
"[4 −2; −3 1]",
"[−2 1; 3 −1]",
"[1 3; 2 4]"
],
"|A| = −2, A⁻¹ = (1/−2)[4 −2; −3 1] = [−2 1; 1.5 −0.5]."
],
[
"la-review",
"Which statement about Unit I is correct?",
"Inverse, rank, elimination and LU all rest on the same elementary row operations",
[
"QR needs no arithmetic",
"Determinants exist for rectangular matrices",
"Rank applies only to square matrices"
],
"Determinants are only for square matrices; rank works for any shape."
],
[
"la-review",
"det(A) = 14 for A = [5 3; 2 4]. Therefore:",
"A is invertible and AX = B has a unique solution for every B",
[
"A is singular",
"rank(A) = 1",
"AX = B has infinitely many solutions"
],
"Non-zero determinant ⇒ full rank ⇒ unique solution."
],
[
"la-eig",
"Find the eigenvalues of A.\nA = | 0  2 |\n    | 0  1 |",
"λ = 1, 0",
[
"λ = −1, 0",
"λ = 2, 1",
"λ = 3, 0"
],
"trace = 1, det = 0: λ² − (1)λ + (0) = 0 ⇒ (λ − 1)(λ − 0) = 0. Check: 1 + 0 = 1, 1×0 = 0."
],
[
"la-eig",
"Find the eigenvalues of A.\nA = | −2   1 |\n    | −6   5 |",
"λ = 4, −1",
[
"λ = −4, 1",
"λ = −2, 5",
"λ = 3, −4"
],
"trace = 3, det = −4: λ² − (3)λ + (−4) = 0 ⇒ (λ − 4)(λ − −1) = 0. Check: 4 + −1 = 3, 4×−1 = −4."
],
[
"la-eig",
"Find the eigenvalues of A.\nA = |  4  −4 |\n    |  1   9 |",
"λ = 8, 5",
[
"λ = −8, −5",
"λ = 4, 9",
"λ = 13, 40"
],
"trace = 13, det = 40: λ² − (13)λ + (40) = 0 ⇒ (λ − 8)(λ − 5) = 0. Check: 8 + 5 = 13, 8×5 = 40."
],
[
"la-eig",
"Find the eigenvalues of A.\nA = |  2  −2 |\n    |  0   5 |",
"λ = 5, 2",
[
"λ = −5, −2",
"λ = 6, 3",
"λ = 7, 10"
],
"trace = 7, det = 10: λ² − (7)λ + (10) = 0 ⇒ (λ − 5)(λ − 2) = 0. Check: 5 + 2 = 7, 5×2 = 10."
],
[
"la-eig",
"Find the eigenvalues of A.\nA = | −1  −2 |\n    | −3   4 |",
"λ = 5, −2",
[
"λ = −5, 2",
"λ = −1, 4",
"λ = 3, −10"
],
"trace = 3, det = −10: λ² − (3)λ + (−10) = 0 ⇒ (λ − 5)(λ − −2) = 0. Check: 5 + −2 = 3, 5×−2 = −10."
],
[
"la-eig",
"Find the eigenvalues of A.\nA = | 3  4 |\n    | 0  8 |",
"λ = 8, 3",
[
"λ = −8, −3",
"λ = 9, 4",
"λ = 11, 24"
],
"trace = 11, det = 24: λ² − (11)λ + (24) = 0 ⇒ (λ − 8)(λ − 3) = 0. Check: 8 + 3 = 11, 8×3 = 24."
],
[
"la-eig",
"Find the eigenvalues of the triangular matrix [0 -1; 0 -4].",
"λ = 0, −4",
[
"λ = 0, −1",
"λ = 0, −2",
"λ = −1, 0"
],
"For a triangular matrix the eigenvalues are the diagonal entries."
],
[
"la-eig",
"Find the eigenvalues of the triangular matrix [7 4; 0 6].",
"λ = 7, 6",
[
"λ = 7, 4",
"λ = 13, 42",
"λ = 4, 0"
],
"For a triangular matrix the eigenvalues are the diagonal entries."
],
[
"la-eig",
"Find the eigenvalues of the triangular matrix [8 -2; 0 -2].",
"λ = 8, −2",
[
"λ = 9, −2",
"λ = 6, −16",
"λ = −2, 0"
],
"For a triangular matrix the eigenvalues are the diagonal entries."
],
[
"la-eig",
"An eigenvector of A = [6 1; 2 5] for λ = 7 is:",
"(1, 1)",
[
"(1, −2)",
"(1, 7)",
"(2, 1)"
],
"Solve (A − 7I)v = 0 and check: A(1, 1) = 7·(1, 1)."
],
[
"la-eig",
"An eigenvector of A = [1 4; 2 3] for λ = -1 is:",
"(2, −1)",
[
"(1, 1)",
"(1, 2)",
"(−1, 1)"
],
"Solve (A − −1I)v = 0 and check: A(2, −1) = −1·(2, −1)."
],
[
"la-eig",
"An eigenvector of A = [7 −2; −2 4] for λ = 3 is:",
"(1, 2)",
[
"(−2, 1)",
"(2, 1)",
"(1, −2)"
],
"Solve (A − 3I)v = 0 and check: A(1, 2) = 3·(1, 2)."
],
[
"la-eig",
"An eigenvector of A = [2 3; 2 1] for λ = 4 is:",
"(3, 2)",
[
"(1, −1)",
"(2, 3)",
"(1, 1)"
],
"Solve (A − 4I)v = 0 and check: A(3, 2) = 4·(3, 2)."
],
[
"la-eig",
"If one eigenvalue of A is 0, then:",
"A is singular (det A = 0)",
[
"A is the identity",
"A is orthogonal",
"All eigenvalues are 0"
],
"The product of eigenvalues equals det(A)."
],
[
"la-eig",
"The sum of the eigenvalues of A equals:",
"The trace of A",
[
"The determinant of A",
"The rank of A",
"The largest entry of A"
],
"Trace = sum of diagonal = sum of eigenvalues."
],
[
"la-eig",
"The characteristic equation of a square matrix A is:",
"det(A − λI) = 0",
[
"A − λ = 0",
"det(A) = λ",
"Aᵀ = λA"
],
"Av = λv with v ≠ 0 needs A − λI to be singular."
],
[
"la-eig",
"If v is an eigenvector of A for λ = 3, then 5v is:",
"Also an eigenvector for λ = 3",
[
"An eigenvector for λ = 15",
"Not an eigenvector",
"An eigenvector for λ = 5"
],
"A(5v) = 5Av = 5·3v = 3(5v)."
],
[
"la-eig",
"A = [1 2; 2 1] has trace 2 and determinant −3. Its eigenvalues are:",
"3 and −1",
[
"2 and −3",
"1 and 1",
"−3 and 1"
],
"λ² − 2λ − 3 = (λ − 3)(λ + 1)."
],
[
"la-diag",
"D = [1 0; 0 2]. Find D^4.",
"[1 0; 0 16]",
[
"[4 0; 0 8]",
"[1 2; 2 16]",
"[1 0; 0 8]"
],
"Powers of a diagonal matrix: raise each diagonal entry to the power 4."
],
[
"la-diag",
"D = [-1 0; 0 3]. Find D^3.",
"[−1 0; 0 27]",
[
"[−3 0; 0 9]",
"[−1 −3; −3 27]",
"[1 0; 0 9]"
],
"Powers of a diagonal matrix: raise each diagonal entry to the power 3."
],
[
"la-diag",
"D = [-3 0; 0 4]. Find D^5.",
"[−243 0; 0 1024]",
[
"[−15 0; 0 20]",
"[−243 −12; −12 1024]",
"[81 0; 0 256]"
],
"Powers of a diagonal matrix: raise each diagonal entry to the power 5."
],
[
"la-diag",
"D = [2 0; 0 5]. Find D^3.",
"[8 0; 0 125]",
[
"[6 0; 0 15]",
"[8 10; 10 125]",
"[4 0; 0 25]"
],
"Powers of a diagonal matrix: raise each diagonal entry to the power 3."
],
[
"la-diag",
"Using A = PDP⁻¹ (or directly), find A² for A = [3 2; 1 2].",
"[11 10; 5 6]",
[
"[9 4; 1 4]",
"[6 4; 2 4]",
"[11 5; 10 6]"
],
"A² = PD²P⁻¹; the answer must equal A·A computed directly."
],
[
"la-diag",
"Using A = PDP⁻¹ (or directly), find A² for A = [4 1; 2 3].",
"[18 7; 14 11]",
[
"[16 1; 4 9]",
"[8 2; 4 6]",
"[18 14; 7 11]"
],
"A² = PD²P⁻¹; the answer must equal A·A computed directly."
],
[
"la-diag",
"Using A = PDP⁻¹ (or directly), find A² for A = [2 3; 2 1].",
"[10 9; 6 7]",
[
"[4 9; 4 1]",
"[4 6; 4 2]",
"[10 6; 9 7]"
],
"A² = PD²P⁻¹; the answer must equal A·A computed directly."
],
[
"la-diag",
"Using A = PDP⁻¹ (or directly), find A² for A = [6 1; 2 5].",
"[38 11; 22 27]",
[
"[36 1; 4 25]",
"[12 2; 4 10]",
"[38 22; 11 27]"
],
"A² = PD²P⁻¹; the answer must equal A·A computed directly."
],
[
"la-diag",
"In A = PDP⁻¹, the columns of P are:",
"The eigenvectors of A",
[
"The eigenvalues of A",
"The rows of A",
"The columns of A⁻¹"
],
"D holds the eigenvalues in the same order as P's eigenvector columns."
],
[
"la-diag",
"A 2 × 2 matrix is guaranteed to be diagonalizable when:",
"It has two distinct eigenvalues",
[
"Its determinant is 0",
"It is upper triangular",
"Its trace is 0"
],
"Distinct eigenvalues give two independent eigenvectors."
],
[
"la-diag",
"Aⁿ via diagonalization is:",
"PDⁿP⁻¹",
[
"PⁿDⁿP⁻ⁿ",
"P⁻¹DⁿP",
"nPDP⁻¹"
],
"(PDP⁻¹)ⁿ: the inner P⁻¹P pairs cancel."
],
[
"la-diag",
"A = [4 1; 2 3] has eigenvalues 5 (eigenvector (1, 1)) and 2 (eigenvector (1, −2)). A valid P and D are:",
"P = [1 1; 1 −2], D = [5 0; 0 2]",
[
"P = [1 1; 1 −2], D = [2 0; 0 5]",
"P = [1 1; 1 −2], D = [5 2; 0 0]",
"P = [5 0; 0 2], D = [1 1; 1 −2]"
],
"The order of eigenvalues in D must match the order of eigenvector columns in P."
],
[
"la-diag",
"Why is A¹⁰ via diagonalization faster than direct multiplication?",
"D¹⁰ only needs each diagonal number raised to the 10th power, with one P and one P⁻¹",
[
"Because P⁻¹ = P always",
"Because A¹⁰ = 10A",
"Because D¹⁰ = D"
],
"Direct multiplication needs 9 matrix products."
],
[
"la-diag",
"A = [3 2; 1 2] with P = [2 1; 1 −1], D = [4 0; 0 1]. A² is:",
"[11 10; 5 6]",
[
"[9 4; 1 4]",
"[16 0; 0 1]",
"[6 4; 2 4]"
],
"PD²P⁻¹ = A·A = [11 10; 5 6]."
],
[
"la-diag",
"The first step in diagonalizing A is always:",
"Find the eigenvalues from det(A − λI) = 0",
[
"Find P⁻¹",
"Compute Aᵀ",
"Find the rank of D"
],
"Eigenvalues come first, then each eigenvector, then P and D."
],
[
"la-spec",
"The Spectral Theorem applies to:",
"Real symmetric matrices",
[
"All square matrices",
"Only diagonal matrices",
"Only orthogonal matrices"
],
"A = Aᵀ with real entries."
],
[
"la-spec",
"For a real symmetric matrix, eigenvectors for different eigenvalues are:",
"Orthogonal",
[
"Parallel",
"Always equal",
"Complex"
],
"Their dot product is 0, which is what lets Q be orthogonal."
],
[
"la-spec",
"In A = QDQᵀ, the columns of Q are:",
"Normalized (unit−length) eigenvectors of A",
[
"Eigenvalues of A",
"Rows of A",
"Any eigenvectors, without scaling"
],
"Normalising makes Q orthogonal so that Q⁻¹ = Qᵀ."
],
[
"la-spec",
"The big practical advantage of A = QDQᵀ over A = PDP⁻¹ is:",
"No matrix inverse is needed, since Q⁻¹ = Qᵀ",
[
"D has no zeros",
"It works for every matrix",
"Q is always the identity"
],
"It is also numerically more stable."
],
[
"la-spec",
"A = [9 12; 12 16]. Its eigenvalues are:",
"25 and 0",
[
"9 and 16",
"21 and 4",
"12 and 12"
],
"trace 25, det 144 − 144 = 0 ⇒ λ(λ − 25) = 0."
],
[
"la-spec",
"For A = [9 12; 12 16], the unit eigenvector for λ = 25 is:",
"(0.6, 0.8)",
[
"(0.8, −0.6)",
"(3, 4)",
"(0.75, 1)"
],
"−16x + 12y = 0 ⇒ (3, 4); its length is 5, so (0.6, 0.8)."
],
[
"la-spec",
"A = [−1 12; 12 6]. Its eigenvalues are:",
"15 and −10",
[
"−1 and 6",
"12 and −12",
"10 and −15"
],
"trace 5, det −6 − 144 = −150 ⇒ λ² − 5λ − 150 = (λ − 15)(λ + 10)."
],
[
"la-spec",
"A real symmetric matrix can have:",
"Only real eigenvalues",
[
"Complex eigenvalues in conjugate pairs",
"No eigenvalues",
"Only positive eigenvalues"
],
"Part 1 of the Spectral Theorem."
],
[
"la-spec",
"Eigenvectors (1, −2) and (2, 1) of A = [4 2; 2 1]:",
"Are orthogonal, as the Spectral Theorem predicts",
[
"Are parallel",
"Prove A is not symmetric",
"Show A is orthogonal"
],
"(1)(2) + (−2)(1) = 0."
],
[
"la-spec",
"Why can a non-symmetric matrix fail to be orthogonally diagonalized?",
"Its eigenvectors need not be perpendicular",
[
"It has no determinant",
"Its trace is undefined",
"It has no eigenvalues"
],
"The orthogonality guarantee only holds when A = Aᵀ."
],
[
"la-spec",
"Find the eigenvalues of the symmetric matrix A = [−1 12; 12 6].",
"15 and −10",
[
"−1 and 6",
"5 and −150",
"−15 and 10"
],
"trace = 5, det = −150; factor λ² − (trace)λ + det."
],
[
"la-pca",
"A covariance matrix has eigenvalues 50 and 25. What share of the variance does the first principal component explain?",
"66.7%",
[
"33.3%",
"50%",
"100%"
],
"50 / (50 + 25) = 66.7%."
],
[
"la-pca",
"A covariance matrix has eigenvalues 9 and 1. What share of the variance does the first principal component explain?",
"90%",
[
"10%",
"9%",
"100%"
],
"9 / (9 + 1) = 90%."
],
[
"la-pca",
"A covariance matrix has eigenvalues 40 and 10. What share of the variance does the first principal component explain?",
"80%",
[
"20%",
"40%",
"100%"
],
"40 / (40 + 10) = 80%."
],
[
"la-pca",
"A covariance matrix has eigenvalues 30 and 20. What share of the variance does the first principal component explain?",
"60%",
[
"40%",
"30%",
"100%"
],
"30 / (30 + 20) = 60%."
],
[
"la-pca",
"In PCA, the principal components are:",
"The eigenvectors of the covariance matrix",
[
"The eigenvalues of the data matrix",
"The largest data points",
"The rows of the covariance matrix"
],
"Eigenvalues measure the variance along each component."
],
[
"la-pca",
"A covariance matrix is always:",
"Symmetric",
[
"Orthogonal",
"Upper triangular",
"Singular"
],
"Cov(X, Y) = Cov(Y, X), which is why the Spectral Theorem applies."
],
[
"la-pca",
"Dimensionality reduction with PCA means:",
"Keeping only the top few principal components that explain most of the variance",
[
"Deleting columns at random",
"Taking the transpose",
"Setting all eigenvalues to 1"
],
"Lecture 16."
],
[
"la-pca",
"PageRank scores are the eigenvector of the link matrix for eigenvalue:",
"1",
[
"0",
"The largest diagonal entry",
"−1"
],
"A column-stochastic matrix always has dominant eigenvalue 1."
],
[
"la-pca",
"A link matrix is column-stochastic. This means:",
"Every column sums to 1",
[
"Every row sums to 0",
"It is symmetric",
"Its determinant is 1"
],
"Each page shares its whole vote among the pages it links to."
],
[
"la-pca",
"Two pages link only to each other: M = [0 1; 1 0]. Their PageRank scores are:",
"0.5 and 0.5",
[
"1 and 0",
"0 and 1",
"1 and 1"
],
"M(1, 1) = (1, 1), scaled to sum to 1."
],
[
"la-pca",
"For millions of web pages, the PageRank eigenvector is found by:",
"The power method: repeatedly multiplying a starting vector by M",
[
"Solving the characteristic equation by hand",
"Cofactor expansion",
"Taking the transpose of M"
],
"Characteristic polynomials are impractical at that size."
],
[
"la-pca",
"Page A links to B and C; B links to C; C links to A. Column A of the link matrix is:",
"(0, ½, ½)",
[
"(½, ½, 0)",
"(0, 1, 1)",
"(1, 0, 0)"
],
"Page A splits its vote equally between its two outgoing links."
],
[
"la-pca",
"PCA and PageRank both depend mainly on:",
"An eigenvector (a direction or a ranking)",
[
"Only the determinant",
"Only the trace",
"The inverse of the matrix"
],
"The eigenvalue is only a number; the vector carries the answer."
],
[
"la-pca",
"For covariance A = [34 12; 12 41], the unit eigenvector of λ = 50 is:",
"(0.6, 0.8)",
[
"(0.8, −0.6)",
"(3, 4)",
"(0.8, 0.6)"
],
"−16x + 12y = 0 ⇒ (3, 4) → divide by 5."
]
],
"casesets": [],
"cases": [],
"short": [
[
"la-ops",
"Define the order of a matrix. If A is 2 × 3 and B is 3 × 4, state whether AB and BA exist and give the order of the product that exists. (5 marks)",
[
[
"Order = number of rows × number of columns (m × n)",
1,
"rows|columns|m × n|m x n"
],
[
"AB exists because columns of A (3) = rows of B (3)",
1.5,
"3 = 3|columns of a|rows of b|exists"
],
[
"AB has order 2 × 4",
1,
"2 × 4|2 x 4|2x4"
],
[
"BA does not exist: columns of B (4) ≠ rows of A (2)",
1.5,
"not exist|not defined|4 ≠ 2|does not"
]
],
"BT2 · Understand"
],
[
"la-ops",
"Show with an example that matrix multiplication is not commutative. (5 marks)",
[
[
"Chooses two 2 × 2 matrices A and B",
1,
"a =|b =|let"
],
[
"Computes AB correctly, row × column",
1.5,
"ab ="
],
[
"Computes BA correctly",
1.5,
"ba ="
],
[
"Concludes AB ≠ BA, so multiplication is not commutative",
1,
"≠|not equal|not commutative"
]
],
"BT3 · Apply"
],
[
"la-trans",
"Find the inverse of A = [2 1; 5 3] using the Gauss–Jordan method and verify that AA⁻¹ = I. (5 marks)",
[
[
"Writes [A | I]",
1,
"[a | i]|augment"
],
[
"Correct row operations, each one named",
1.5,
"r1|r2|→"
],
[
"A⁻¹ = [3 −1; −5 2]",
1.5,
"3 −1|3 -1|−5 2|-5 2"
],
[
"Verifies AA⁻¹ = I",
1,
"verify|check|= i"
]
],
"BT3 · Apply"
],
[
"la-trans",
"Define symmetric and skew-symmetric matrices with one example each. Prove that the diagonal of a skew-symmetric matrix is zero. (5 marks)",
[
[
"Symmetric: Aᵀ = A, with an example",
1.5,
"aᵀ = a|a^t = a|transpose equals|symmetric"
],
[
"Skew-symmetric: Aᵀ = −A, with an example",
1.5,
"−a|-a|skew"
],
[
"Proof: aᵢᵢ = −aᵢᵢ ⇒ 2aᵢᵢ = 0 ⇒ aᵢᵢ = 0",
2,
"2a|= 0|diagonal"
]
],
"BT2 · Understand"
],
[
"la-trans",
"For A = [1 2; 3 4] and B = [0 1; 2 1], verify that (AB)ᵀ = BᵀAᵀ. (5 marks)",
[
[
"AB = [4 3; 8 7]",
1.5,
"4 3|8 7"
],
[
"(AB)ᵀ = [4 8; 3 7]",
1,
"4 8|3 7"
],
[
"BᵀAᵀ computed = [4 8; 3 7]",
1.5,
"bᵀaᵀ|b^ta^t|4 8"
],
[
"Concludes both are equal",
1,
"equal|verified|hence"
]
],
"BT3 · Apply"
],
[
"la-det",
"Evaluate the determinant of A = [2 1 3; 0 4 1; 1 0 2] and state whether A is singular. (5 marks)",
[
[
"Chooses a row/column and uses + − + signs",
1,
"expand|cofactor|+ − +"
],
[
"Correct minors (8, −1, −4 along row 1)",
2,
"8|−1|-1|−4|-4"
],
[
"|A| = 2(8) − 1(−1) + 3(−4) = 5",
1,
"= 5"
],
[
"Non-singular because |A| ≠ 0",
1,
"non-singular|non singular|invertible|≠ 0"
]
],
"BT3 · Apply"
],
[
"la-det",
"State any four properties of determinants. (5 marks)",
[
[
"|Aᵀ| = |A|",
1.25,
"transpose|aᵀ"
],
[
"Row swap changes the sign",
1.25,
"swap|interchang|sign"
],
[
"Two identical/proportional rows or a zero row ⇒ |A| = 0",
1.25,
"identical|equal rows|proportional|zero row"
],
[
"|AB| = |A||B| or |kA| = kⁿ|A| or adding a multiple of a row leaves |A| unchanged",
1.25,
"|ab|kⁿ|k^n|multiple|unchanged"
]
],
"BT1 · Remember"
],
[
"la-det",
"Define the rank of a matrix. Find the rank of A = [1 2 3; 2 4 6; 0 1 1]. (5 marks)",
[
[
"Rank = number of non-zero rows in row echelon form / independent rows",
1.5,
"non-zero rows|independent|echelon"
],
[
"R2 → R2 − 2R1 gives a zero row",
1.5,
"r2 − 2r1|r2-2r1|zero row|(0, 0, 0)|0 0 0"
],
[
"Rank = 2",
2,
"rank = 2|rank is 2|rank 2"
]
],
"BT3 · Apply"
],
[
"la-gauss",
"State the conditions, in terms of rank, for a system AX = B in n unknowns to have a unique solution, infinitely many solutions or no solution. (5 marks)",
[
[
"Unique: rank(A) = rank[A|B] = n",
1.75,
"unique|= n"
],
[
"Infinite: rank(A) = rank[A|B] < n",
1.75,
"infinite|< n"
],
[
"None: rank(A) ≠ rank[A|B] (inconsistent)",
1.5,
"≠|inconsistent|no solution"
]
],
"BT1 · Remember"
],
[
"la-gauss",
"Use Gaussian elimination to decide whether x + y + z = 2, 2x + 2y + 2z = 5, x − y = 0 is consistent. (5 marks)",
[
[
"Writes the augmented matrix [A | B]",
1,
"augment|[a | b]|[a|b]"
],
[
"R2 → R2 − 2R1 gives (0 0 0 | 1)",
2,
"0 0 0|0 = 1|r2 − 2r1|r2-2r1"
],
[
"rank(A) ≠ rank[A|B]",
1,
"rank"
],
[
"Inconsistent: no solution",
1,
"inconsistent|no solution"
]
],
"BT4 · Analyse"
],
[
"la-lu",
"What is LU decomposition? Find the LU decomposition of A = [2 1; 6 5] and verify it. (5 marks)",
[
[
"L unit lower triangular, U upper triangular, A = LU",
1.5,
"lower|upper|a = lu"
],
[
"Multiplier 3 from R2 → R2 − 3R1",
1,
"3r1|m = 3|multiplier"
],
[
"L = [1 0; 3 1], U = [2 1; 0 2]",
1.5,
"1 0; 3 1|2 1; 0 2"
],
[
"Verifies LU = A",
1,
"verify|check|lu ="
]
],
"BT3 · Apply"
],
[
"la-lu",
"Explain why LU decomposition is preferred when AX = B must be solved for many different B with the same A. (5 marks)",
[
[
"Elimination (the costly part) is done once to get L and U",
2,
"once|factor|reuse"
],
[
"Each new B needs only Ly = B (forward) then Ux = y (back)",
2,
"forward|back|ly = b|ux = y"
],
[
"Business example, e.g. weekly orders with the same recipe/standing order matrix",
1,
"weekly|order|production|example"
]
],
"BT2 · Understand"
],
[
"la-qr",
"Define an orthogonal matrix. Show that Q = [0.6 −0.8; 0.8 0.6] is orthogonal and write Q⁻¹. (5 marks)",
[
[
"Definition QᵀQ = I (perpendicular unit columns)",
1.5,
"qᵀq = i|q^tq|perpendicular|unit"
],
[
"Computes QᵀQ = I correctly",
2,
"0.36|0.64|= i"
],
[
"Q⁻¹ = Qᵀ = [0.6 0.8; −0.8 0.6]",
1.5,
"0.6 0.8|qᵀ|q^t"
]
],
"BT3 · Apply"
],
[
"la-qr",
"Find the QR decomposition of A with columns a₁ = (8, 6) and a₂ = (1, 7) using the Gram–Schmidt process. (5 marks)",
[
[
"‖a₁‖ = 10, e₁ = (0.8, 0.6)",
1.5,
"10|0.8, 0.6"
],
[
"a₂·e₁ = 5 and u₂ = (−3, 4)",
1.5,
"= 5|−3, 4|-3, 4"
],
[
"e₂ = (−0.6, 0.8), Q = [0.8 −0.6; 0.6 0.8]",
1,
"−0.6|-0.6"
],
[
"R = [10 5; 0 5]",
1,
"10 5|0 5"
]
],
"BT3 · Apply"
],
[
"la-eig",
"Define eigenvalue and eigenvector. Find the eigenvalues of A = [4 1; 2 3] and verify using the trace and determinant. (5 marks)",
[
[
"Av = λv, v ≠ 0",
1,
"av = λv|av=λv|non-zero"
],
[
"Characteristic equation λ² − 7λ + 10 = 0",
1.5,
"λ² − 7λ|λ^2|characteristic"
],
[
"λ = 5, 2",
1.5,
"5|2"
],
[
"Sum 7 = trace, product 10 = det",
1,
"trace|det"
]
],
"BT3 · Apply"
],
[
"la-eig",
"State four properties of eigenvalues. (5 marks)",
[
[
"Sum of eigenvalues = trace",
1.25,
"trace"
],
[
"Product = determinant",
1.25,
"determinant|product"
],
[
"Triangular matrix: eigenvalues are the diagonal entries",
1.25,
"triangular|diagonal"
],
[
"Zero eigenvalue ⇔ singular, or a multiple of an eigenvector is an eigenvector",
1.25,
"singular|zero|multiple"
]
],
"BT1 · Remember"
],
[
"la-diag",
"When is a square matrix diagonalizable? Explain how diagonalization helps to compute Aⁿ. (5 marks)",
[
[
"n linearly independent eigenvectors; distinct eigenvalues suffice for 2 × 2",
1.5,
"independent|distinct"
],
[
"A = PDP⁻¹: P eigenvectors as columns, D eigenvalues",
1.5,
"pdp|p d p"
],
[
"Aⁿ = PDⁿP⁻¹; Dⁿ just powers the diagonal",
2,
"dⁿ|d^n|pdⁿ|power"
]
],
"BT2 · Understand"
],
[
"la-spec",
"State the Spectral Theorem for real symmetric matrices and explain why A = QDQᵀ needs no matrix inverse. (5 marks)",
[
[
"Real eigenvalues",
1,
"real"
],
[
"Eigenvectors of different eigenvalues are orthogonal",
1.5,
"orthogonal|perpendicular"
],
[
"A = QDQᵀ with normalized eigenvectors in Q",
1.5,
"qdqᵀ|qdq^t|normal"
],
[
"Q is orthogonal so Q⁻¹ = Qᵀ",
1,
"q⁻¹ = qᵀ|inverse|transpose"
]
],
"BT2 · Understand"
],
[
"la-pca",
"Explain how eigenvalues and eigenvectors are used in Principal Component Analysis. (5 marks)",
[
[
"Covariance matrix (symmetric) captures the spread of data",
1,
"covariance|symmetric"
],
[
"Eigenvectors = principal components (directions of variation)",
1.5,
"principal component|direction"
],
[
"Eigenvalue = variance along the component; share = λ/Σλ",
1.5,
"variance|share|explain"
],
[
"Keep the top few components: dimensionality reduction",
1,
"dimension|reduce|top"
]
],
"BT2 · Understand"
],
[
"la-pca",
"How does Google's PageRank use an eigenvector? Illustrate with two pages that link to each other. (5 marks)",
[
[
"Link matrix: each column splits a page's vote equally; column-stochastic",
1.5,
"column|stochastic|vote"
],
[
"PageRank = eigenvector for eigenvalue 1, scaled to sum 1",
1.5,
"eigenvalue 1|λ = 1|sum to 1"
],
[
"M = [0 1; 1 0], M(1,1) = (1,1)",
1,
"0 1; 1 0|(1, 1)|(1,1)"
],
[
"Scores 0.5 and 0.5",
1,
"0.5"
]
],
"BT3 · Apply"
]
],
"longq": [
[
"la-ops",
"Explain the different types of matrices with examples. A firm sells 3 products in 2 cities. Quantities sold: Q = [20 15 10; 12 18 25] (rows = cities). Prices per unit: P = [50; 80; 120]. Find the revenue in each city using matrix multiplication and interpret the result. (10 marks)",
[
[
"Defines at least 6 types (row, column, square, zero, diagonal, scalar, identity, triangular) with examples",
3,
"row matrix|column|square|diagonal|identity|scalar|triangular"
],
[
"Checks order: (2 × 3)(3 × 1) = 2 × 1",
2,
"2 × 1|2 x 1|order"
],
[
"City 1 revenue = 20·50 + 15·80 + 10·120 = ₹3,400",
2,
"3400|3,400"
],
[
"City 2 revenue = 12·50 + 18·80 + 25·120 = ₹5,040",
2,
"5040|5,040"
],
[
"Interprets: city 2 earns more; matrix form handles many products at once",
1,
"city 2|more|interpret"
]
],
"BT3 · Apply"
],
[
"la-trans",
"Find the inverse of A = [1 2; 3 4] by the Gauss–Jordan method and verify AA⁻¹ = I. Also prove that (AB)⁻¹ = B⁻¹A⁻¹ for invertible A and B. (10 marks)",
[
[
"[A | I] set up correctly",
1,
"[a | i]|augment"
],
[
"Each row operation named and correct",
3,
"r1|r2|→"
],
[
"A⁻¹ = [−2 1; 1.5 −0.5]",
2,
"−2 1|-2 1|1.5|−0.5|-0.5"
],
[
"Verification AA⁻¹ = I",
1,
"verify|check"
],
[
"Proof: (AB)(B⁻¹A⁻¹) = A(BB⁻¹)A⁻¹ = AA⁻¹ = I",
3,
"bb⁻¹|b b^-1|= i|associat"
]
],
"BT3 · Apply"
],
[
"la-det",
"State and illustrate any five properties of determinants. Hence find the values of x for which M = [x 3; 3 x] is singular, and find the rank of [1 0 2; 2 1 3; 3 1 5]. (10 marks)",
[
[
"Five properties stated correctly",
3,
"transpose|swap|sign|proportional|kⁿ|k^n|product"
],
[
"Each illustrated with a small example",
2,
"example|e.g."
],
[
"x² − 9 = 0 ⇒ x = ±3",
2,
"x² − 9|x^2|±3|3 or −3|3 or -3"
],
[
"Echelon form has 2 non-zero rows ⇒ rank 2",
3,
"rank = 2|rank 2|rank is 2"
]
],
"BT3 · Apply"
],
[
"la-gauss",
"A shop sells snack boxes P, Q and R. One of each costs ₹700; two P, one Q and one R cost ₹1,000; one P, two Q and one R cost ₹900. Form the system, solve it by Gaussian elimination and verify. Also explain the rank conditions for consistency. (10 marks)",
[
[
"Forms x + y + z = 7, 2x + y + z = 10, x + 2y + z = 9 (₹ hundred)",
2,
"x + y + z = 7|2x + y + z"
],
[
"Augmented matrix and named row operations",
2,
"augment|r2|r3"
],
[
"Back-substitution: x = 3, y = 2, z = 2 (₹300, ₹200, ₹200)",
3,
"x = 3|300|y = 2|200"
],
[
"Verification in an original equation",
1,
"verify|check"
],
[
"Rank conditions: unique, infinite, none",
2,
"rank|unique|infinite|inconsistent"
]
],
"BT4 · Analyse"
],
[
"la-lu",
"Find the LU decomposition of A = [1 1 1; 2 1 3; 1 2 1]. Using it, explain the steps to solve AX = B, and solve AX = (7, 27) for A = [2 1; 6 5] using L = [1 0; 3 1] and U = [2 1; 0 2]. (10 marks)",
[
[
"Multipliers 2, 1, −1 identified",
2,
"m = 2|multiplier|−1|-1"
],
[
"U = [1 1 1; 0 −1 1; 0 0 1]",
2,
"0 −1 1|0 -1 1|0 0 1"
],
[
"L = [1 0 0; 2 1 0; 1 −1 1]",
2,
"1 −1 1|1 -1 1|2 1 0"
],
[
"Forward Ly = B gives y = (7, 6)",
2,
"y = (7, 6)|y1 = 7|y2 = 6"
],
[
"Back Ux = y gives x₁ = 2, x₂ = 3",
2,
"x2 = 3|x₂ = 3|x1 = 2|x₁ = 2"
]
],
"BT3 · Apply"
],
[
"la-qr",
"Explain the Gram–Schmidt process. Find the QR decomposition of A with columns (8, 6) and (1, 7), and use it to solve AX = (17, 19). State two applications of QR decomposition. (10 marks)",
[
[
"Explains e₁ = a₁/‖a₁‖, u₂ = a₂ − (a₂·e₁)e₁, e₂ = u₂/‖u₂‖",
2,
"e1|e₁|u2|u₂|normal"
],
[
"Q = [0.8 −0.6; 0.6 0.8]",
2,
"0.8 −0.6|0.8 -0.6"
],
[
"R = [10 5; 0 5]",
2,
"10 5|0 5"
],
[
"QᵀB = (25, 5) and x₁ = 2, x₂ = 1",
2,
"25|x1 = 2|x₁ = 2|x2 = 1"
],
[
"Two applications: least squares, stable solving, graphics, eigenvalue algorithms, PCA",
2,
"least squares|regression|graphics|eigenvalue|pca"
]
],
"BT3 · Apply"
],
[
"la-eig",
"Find the eigenvalues and eigenvectors of A = [6 1; 2 5]. Verify the trace and determinant properties and interpret the larger eigenvalue in a two-sector growth model. (10 marks)",
[
[
"Characteristic equation λ² − 11λ + 28 = 0",
2,
"λ² − 11λ|λ^2 - 11|28"
],
[
"λ = 7, 4",
2,
"7|4"
],
[
"λ = 7 → v = (1, 1)",
2,
"(1, 1)|(1,1)"
],
[
"λ = 4 → v = (1, −2)",
2,
"(1, −2)|(1,-2)|(1, -2)"
],
[
"Checks 7 + 4 = 11, 7 × 4 = 28 and interprets λ = 7 as the dominant growth rate along (1, 1)",
2,
"trace|det|dominant|growth"
]
],
"BT4 · Analyse"
],
[
"la-diag",
"Diagonalize A = [2 3; 2 1]: find P and D, verify PDP⁻¹ = A, and use it to compute A². (10 marks)",
[
[
"Eigenvalues 4 and −1",
2,
"4|−1|-1"
],
[
"Eigenvectors (3, 2) and (1, −1)",
2,
"(3, 2)|(1, −1)|(1, -1)"
],
[
"P = [3 1; 2 −1], D = [4 0; 0 −1], P⁻¹ = [1/5 1/5; 2/5 −3/5]",
2,
"p =|1/5|2/5"
],
[
"Verification PDP⁻¹ = A",
2,
"verify|= a"
],
[
"A² = [10 9; 6 7]",
2,
"10 9|6 7"
]
],
"BT3 · Apply"
],
[
"la-spec",
"State the Spectral Theorem. Orthogonally diagonalize A = [9 12; 12 16] and verify that its eigenvectors are orthogonal. (10 marks)",
[
[
"Statement: real eigenvalues, orthogonal eigenvectors, A = QDQᵀ",
2,
"real|orthogonal|qdq"
],
[
"λ = 25, 0",
2,
"25|0"
],
[
"Eigenvectors (3, 4) and (4, −3), dot product 0",
2,
"(3, 4)|(4, −3)|(4, -3)|= 0"
],
[
"Normalized Q = [0.6 0.8; 0.8 −0.6], D = [25 0; 0 0]",
2,
"0.6|0.8|25 0"
],
[
"Explains Q⁻¹ = Qᵀ and links to PCA",
2,
"qᵀ|q^t|pca|inverse"
]
],
"BT3 · Apply"
],
[
"la-pca",
"A dataset has covariance matrix A = [34 12; 12 41]. Find the principal components and the share of variance explained by each, and explain dimensionality reduction. Also explain PageRank with a small example. (10 marks)",
[
[
"Eigenvalues 50 and 25",
2,
"50|25"
],
[
"PC1 = (0.6, 0.8), PC2 = (0.8, −0.6)",
2,
"0.6, 0.8|0.8, −0.6|0.8, -0.6"
],
[
"Shares 66.7% and 33.3%",
2,
"66.7|33.3|2/3"
],
[
"Dimensionality reduction: keep PC1, lose little information",
2,
"reduc|keep|dimension"
],
[
"PageRank: eigenvector for λ = 1 of a column-stochastic link matrix",
2,
"pagerank|λ = 1|stochastic"
]
],
"BT4 · Analyse"
]
],
"long": [
{
"id": "AC1",
"title": "FreshBake: planning three product lines",
"topics": [
"la-gauss",
"la-trans",
"la-lu"
],
"text": "FreshBake, a bakery in Mohali, makes breads (x), cakes (y) and cookies (z) in hundreds of units per day. Each product passes through mixing, baking and packing. Hours needed per hundred units: mixing 2, 1, 1; baking 1, 3, 2; packing 1, 1, 4. Available hours per day: mixing 17, baking 25, packing 31. The owner wants to use all hours fully. Next month the available hours will change every week, but the hours per product stay the same.",
"parts": [
[
"Write the system in the form AX = B and solve it by Gaussian elimination. Verify your answer.",
10,
[
[
"A = [2 1 1; 1 3 2; 1 1 4], B = (17, 25, 31)",
2,
"2 1 1|1 3 2|1 1 4|17|25|31"
],
[
"Named row operations to echelon form",
3,
"r2|r3|echelon"
],
[
"x = 4, y = 3, z = 6 (400 breads, 300 cakes, 600 cookies)",
3,
"x = 4|y = 3|z = 6|400|600"
],
[
"Verification in all three equations",
2,
"verify|check"
]
]
],
[
"Show that A is invertible and explain, using rank, why the plan is unique.",
10,
[
[
"|A| = 16 ≠ 0",
3,
"16|≠ 0|non-zero"
],
[
"Rank(A) = rank[A|B] = 3 = number of unknowns",
4,
"rank|= 3"
],
[
"Concludes a unique production plan exists",
3,
"unique"
]
]
],
[
"The hours change every week but A stays the same. Recommend a method and explain why it saves work.",
10,
[
[
"Recommends LU decomposition (factor A once)",
3,
"lu"
],
[
"Explains Ly = B forward, then Ux = y back for each week",
4,
"forward|back|ly = b|ux = y"
],
[
"Justifies: elimination done once; only two triangular solves per week",
3,
"once|each week|reuse|saves"
]
]
]
]
},
{
"id": "AC2",
"title": "UrbanRide vs MetroCab: market share",
"topics": [
"la-eig",
"la-diag"
],
"text": "Two ride-hailing apps share a city of 1,000 regular riders. Each month 80% of UrbanRide's riders stay and 20% switch to MetroCab; 70% of MetroCab's riders stay and 30% switch to UrbanRide. Today UrbanRide has 600 riders and MetroCab 400. The transition matrix (columns = current app) is T = [0.8 0.3; 0.2 0.7].",
"parts": [
[
"Find the eigenvalues and eigenvectors of T and interpret them.",
10,
[
[
"Characteristic equation λ² − 1.5λ + 0.5 = 0",
2,
"1.5|0.5|characteristic"
],
[
"λ = 1 and λ = 0.5",
3,
"λ = 1|0.5"
],
[
"λ = 1 → (3, 2); λ = 0.5 → (1, −1)",
3,
"(3, 2)|(1, −1)|(1, -1)"
],
[
"Interprets λ = 1 as the long-run steady state; λ = 0.5 part halves each month",
2,
"steady|long run|long-run|halves"
]
]
],
[
"Use diagonalization to find the long-run number of riders for each app.",
10,
[
[
"T = PDP⁻¹ with P = [3 1; 2 −1], D = [1 0; 0 0.5]",
3,
"pdp|p =|d ="
],
[
"Tⁿ = PDⁿP⁻¹ and 0.5ⁿ → 0",
3,
"dⁿ|d^n|→ 0|0.5^n"
],
[
"Steady state in ratio 3 : 2 ⇒ UrbanRide 600, MetroCab 400",
3,
"600|400|3 : 2|3:2"
],
[
"Notes the city is already at steady state",
1,
"already|steady"
]
]
],
[
"Advise MetroCab on what must change in the matrix for it to gain share.",
10,
[
[
"Steady share depends on the switching rates in T",
3,
"switch|rate|retention"
],
[
"Raise retention above 70% or attract more than 20% of UrbanRide riders",
4,
"retention|70|20|attract"
],
[
"Practical actions: loyalty programme, lower wait times, pricing",
3,
"loyalty|price|wait|offer"
]
]
]
]
},
{
"id": "AC3",
"title": "ShopSense: what drives customer spend?",
"topics": [
"la-spec",
"la-pca"
],
"text": "ShopSense, a retail analytics start-up, measured two variables for 500 customers: monthly visits (X₁) and monthly spend (X₂, scaled). Their covariance matrix is C = [34 12; 12 41]. The team wants to reduce the two variables to one score without losing much information, and later rank its partner shops using a link-based score.",
"parts": [
[
"Explain why C can be orthogonally diagonalized, then find its eigenvalues and normalized eigenvectors.",
10,
[
[
"C is symmetric ⇒ Spectral Theorem applies",
2,
"symmetric|spectral"
],
[
"λ² − 75λ + 1250 = 0 ⇒ λ = 50, 25",
3,
"75|1250|50|25"
],
[
"Unit eigenvectors (0.6, 0.8) and (0.8, −0.6)",
3,
"0.6, 0.8|0.8, −0.6|0.8, -0.6"
],
[
"Shows they are orthogonal",
2,
"orthogonal|= 0"
]
]
],
[
"Recommend whether one combined score is enough, with the share of variance explained.",
10,
[
[
"PC1 = 0.6X₁ + 0.8X₂ (direction (0.6, 0.8))",
3,
"0.6|0.8|pc1"
],
[
"Share = 50/75 ≈ 66.7%",
3,
"66.7|2/3"
],
[
"Judgement: one score keeps two-thirds; may be acceptable for a quick dashboard but loses a third",
4,
"recommend|enough|lose|third"
]
]
],
[
"Describe how a PageRank-style score could rank partner shops that recommend each other.",
10,
[
[
"Column-stochastic link matrix of recommendations",
3,
"column|stochastic|link"
],
[
"Score = eigenvector for eigenvalue 1, scaled to sum 1",
4,
"eigenvalue 1|λ = 1|sum"
],
[
"Power method for many shops, plus a small example",
3,
"power method|example"
]
]
]
]
}
],
"videos": [],
"cards": [
[
"la-ops",
"Order of a matrix",
"Rows × columns (m × n)."
],
[
"la-ops",
"When is AB defined?",
"Columns of A = rows of B; (m × n)(n × p) = m × p."
],
[
"la-ops",
"Is AB = BA?",
"Not in general: matrix multiplication is not commutative."
],
[
"la-ops",
"Scalar matrix",
"Diagonal matrix with equal diagonal entries, e.g. 5I."
],
[
"la-trans",
"(AB)ᵀ",
"BᵀAᵀ (order reverses)."
],
[
"la-trans",
"Symmetric",
"Aᵀ = A (aᵢⱼ = aⱼᵢ)."
],
[
"la-trans",
"Skew-symmetric",
"Aᵀ = −A; diagonal entries are 0."
],
[
"la-trans",
"2 × 2 inverse",
"(1/(ad − bc))[d −b; −c a], when ad − bc ≠ 0."
],
[
"la-trans",
"Gauss–Jordan",
"Row-reduce [A | I] to [I | A⁻¹]."
],
[
"la-trans",
"(AB)⁻¹",
"B⁻¹A⁻¹."
],
[
"la-det",
"2 × 2 determinant",
"a₁₁a₂₂ − a₁₂a₂₁."
],
[
"la-det",
"Cofactor signs (3 × 3)",
"+ − + / − + − / + − +"
],
[
"la-det",
"|kA| for n × n",
"kⁿ|A|."
],
[
"la-det",
"|AB|",
"|A||B|."
],
[
"la-det",
"Singular matrix",
"|A| = 0: no inverse, rank < n."
],
[
"la-det",
"Rank",
"Number of non-zero rows in row echelon form."
],
[
"la-gauss",
"Unique solution",
"rank(A) = rank[A|B] = n."
],
[
"la-gauss",
"Infinitely many solutions",
"rank(A) = rank[A|B] < n."
],
[
"la-gauss",
"No solution",
"rank(A) ≠ rank[A|B]; a row reads 0 = non-zero."
],
[
"la-gauss",
"Homogeneous system",
"AX = 0: always consistent (trivial solution)."
],
[
"la-gauss",
"Two stages of Gaussian elimination",
"Forward elimination, then back-substitution."
],
[
"la-lu",
"L in A = LU",
"Unit lower triangular; multipliers below the diagonal."
],
[
"la-lu",
"U in A = LU",
"Upper triangular echelon form."
],
[
"la-lu",
"Solving with LU",
"Ly = B (forward), then Ux = y (back)."
],
[
"la-lu",
"Why LU?",
"Same A, many B: factor once, reuse."
],
[
"la-qr",
"Orthogonal matrix",
"QᵀQ = I; columns perpendicular unit vectors; Q⁻¹ = Qᵀ."
],
[
"la-qr",
"A = QR",
"Q orthogonal, R upper triangular."
],
[
"la-qr",
"Gram–Schmidt step 2",
"u₂ = a₂ − (a₂·e₁)e₁, e₂ = u₂/‖u₂‖."
],
[
"la-qr",
"R entries",
"R₁₁ = ‖a₁‖, R₁₂ = a₂·e₁, R₂₂ = ‖u₂‖."
],
[
"la-qr",
"Solving with QR",
"RX = QᵀB."
],
[
"la-review",
"Invertible?",
"Check det(A) ≠ 0."
],
[
"la-review",
"Same A, many B",
"LU decomposition."
],
[
"la-eig",
"Eigenvector",
"Non-zero v with Av = λv."
],
[
"la-eig",
"Characteristic equation",
"det(A − λI) = 0; for 2 × 2: λ² − (trace)λ + det = 0."
],
[
"la-eig",
"Sum of eigenvalues",
"trace(A)."
],
[
"la-eig",
"Product of eigenvalues",
"det(A)."
],
[
"la-eig",
"Triangular matrix eigenvalues",
"Its diagonal entries."
],
[
"la-diag",
"A = PDP⁻¹",
"P: eigenvectors as columns; D: eigenvalues in the same order."
],
[
"la-diag",
"Aⁿ",
"PDⁿP⁻¹."
],
[
"la-diag",
"Diagonalizable 2 × 2",
"Two distinct eigenvalues guarantee it."
],
[
"la-spec",
"Spectral Theorem",
"Real symmetric A: real eigenvalues, orthogonal eigenvectors, A = QDQᵀ."
],
[
"la-spec",
"Why QDQᵀ is easy",
"Q⁻¹ = Qᵀ: no inverse needed."
],
[
"la-pca",
"Principal components",
"Eigenvectors of the covariance matrix."
],
[
"la-pca",
"Variance explained",
"λᵢ / Σλ."
],
[
"la-pca",
"PageRank",
"Eigenvector for λ = 1 of a column-stochastic link matrix."
],
[
"la-pca",
"Power method",
"Repeatedly multiply a vector by M to find the dominant eigenvector."
]
],
"revision": {
"u1": "<h3>Operations</h3><ul><li>AB needs cols(A) = rows(B); (m×n)(n×p) = m×p · AB ≠ BA</li><li>(AB)ᵀ = BᵀAᵀ · (AB)⁻¹ = B⁻¹A⁻¹</li><li>Symmetric Aᵀ = A · Skew Aᵀ = −A (diagonal 0)</li></ul><h3>Inverse &amp; determinant</h3><ul><li>Gauss–Jordan: [A | I] → [I | A⁻¹]</li><li>2×2: (1/(ad−bc))[d −b; −c a]</li><li>3×3: cofactor expansion + − +</li><li>|kA| = kⁿ|A| · |AB| = |A||B| · |A| = 0 ⇔ singular</li></ul><h3>Rank &amp; systems</h3><ul><li>Rank = non-zero rows in echelon form</li><li>Unique: r(A) = r[A|B] = n · Infinite: r(A) = r[A|B] &lt; n · None: r(A) ≠ r[A|B]</li><li>Gaussian elimination: forward, then back-substitute; verify</li></ul><h3>Decompositions</h3><ul><li><b>LU</b>: L unit lower (multipliers), U echelon · Ly = B then Ux = y · same A, many B</li><li><b>QR</b>: Gram–Schmidt · R₁₁ = ‖a₁‖, R₁₂ = a₂·e₁, R₂₂ = ‖u₂‖ · RX = QᵀB</li><li>Orthogonal: QᵀQ = I, Q⁻¹ = Qᵀ (perpendicular AND unit columns)</li></ul>",
"u2": "<h3>Eigenvalues</h3><ul><li>Av = λv · det(A − λI) = 0 · 2×2: λ² − (tr)λ + det = 0</li><li>Σλ = trace · Πλ = det · triangular: diagonal · λ = 0 ⇔ singular</li></ul><h3>Diagonalization</h3><ul><li>A = PDP⁻¹ (eigenvectors in P, eigenvalues in D, same order)</li><li>Aⁿ = PDⁿP⁻¹ · distinct eigenvalues ⇒ diagonalizable</li></ul><h3>Spectral Theorem</h3><ul><li>Symmetric ⇒ real λ, orthogonal eigenvectors, A = QDQᵀ (normalize!)</li></ul><h3>Applications</h3><ul><li>PCA: eigenvectors of covariance = components; share = λ/Σλ</li><li>PageRank: eigenvector for λ = 1 of column-stochastic M; power method</li></ul>"
},
"upcoming": "Units 3–5 (calculus) will be added as the lectures are posted on CULMS."
};
